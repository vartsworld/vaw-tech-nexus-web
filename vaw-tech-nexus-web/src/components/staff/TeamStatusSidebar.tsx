import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import TypingIndicator from "./TypingIndicator";
import { AnimatePresence } from "framer-motion";

interface TeamMember {
  user_id: string;
  full_name: string;
  status: string;
  avatar_url?: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

interface TeamStatusSidebarProps {
  onlineUsers: Record<string, any>;
  currentUserId?: string;
}

const TeamStatusSidebar = ({ onlineUsers, currentUserId }: TeamStatusSidebarProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Typing indicator for DMs
  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator({
    userId: currentUserId || '',
    recipientId: selectedMember?.user_id
  });

  useEffect(() => {
    fetchTeamMembers();

    // Subscribe to real-time status changes with immediate updates
    const statusChannel = supabase
      .channel('team_status_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence_status'
        },
        (payload) => {
          // Update member status in real-time without full refetch
          const newData = payload.new as { user_id?: string; current_status?: string };
          if (newData && newData.user_id) {
            setTeamMembers(prev => prev.map(member => 
              member.user_id === newData.user_id 
                ? { ...member, status: newData.current_status || member.status }
                : member
            ));
          }
        }
      )
      .subscribe();

    // Also track Supabase Presence for instant online/offline detection
    const presenceChannel = supabase
      .channel('online_users_presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) onlineIds.add(p.user_id);
          });
        });
        setTeamMembers(prev => prev.map(member => ({
          ...member,
          isOnline: onlineIds.has(member.user_id)
        })));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((p: any) => {
          if (p.user_id) {
            setTeamMembers(prev => prev.map(member =>
              member.user_id === p.user_id ? { ...member, isOnline: true } : member
            ));
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((p: any) => {
          if (p.user_id) {
            setTeamMembers(prev => prev.map(member =>
              member.user_id === p.user_id ? { ...member, isOnline: false } : member
            ));
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          await presenceChannel.track({ user_id: currentUserId });
        }
      });

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (selectedMember && currentUserId) {
      fetchDirectMessages();
      
      // Subscribe to real-time direct messages
      const channel = supabase
        .channel(`dm-${currentUserId}-${selectedMember.user_id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Check if message is part of this DM conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === selectedMember.user_id) ||
            (newMsg.sender_id === selectedMember.user_id && newMsg.recipient_id === currentUserId)
          ) {
            setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedMember, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTeamMembers = async () => {
    try {
      // Get all staff profiles
      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, avatar_url')
        .eq('application_status', 'approved');

      // Get presence statuses
      const { data: statuses } = await supabase
        .from('user_presence_status')
        .select('user_id, current_status');

      // Get unique online user IDs from presence
      const onlineUserIds = new Set<string>();
      Object.values(onlineUsers).forEach((presences: any) => {
        const presenceArray = Array.isArray(presences) ? presences : [presences];
        presenceArray.forEach((presence: any) => {
          if (presence.user_id && presence.user_id !== 'demo-user') {
            onlineUserIds.add(presence.user_id);
          }
        });
      });

      if (profiles) {
        const members: TeamMember[] = profiles
          .filter(p => p.user_id !== currentUserId) // Exclude current user
          .map(profile => {
            const status = statuses?.find(s => s.user_id === profile.user_id);
            const isOnline = onlineUserIds.has(profile.user_id);
            return {
              user_id: profile.user_id,
              full_name: profile.full_name,
              status: status?.current_status || 'offline',
              avatar_url: profile.avatar_url,
              isOnline
            };
          })
          // Sort: online users first, then by name
          .sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return a.full_name.localeCompare(b.full_name);
          });

        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchDirectMessages = async () => {
    if (!selectedMember || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedMember.user_id}),and(sender_id.eq.${selectedMember.user_id},recipient_id.eq.${currentUserId})`)
        .is('channel_id', null)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // subscribeToDirectMessages moved inline to useEffect for proper cleanup

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMember || !currentUserId) return;

    const content = newMessage.trim();
    setIsLoading(true);
    stopTyping(); // Clear typing indicator when sending
    
    try {
      setNewMessage('');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content,
          sender_id: currentUserId,
          recipient_id: selectedMember.user_id
        })
        .select('id, content, sender_id, recipient_id, created_at')
        .single();

      if (error) throw error;

      // Optimistic UI: show instantly even if Realtime is delayed.
      if (data) {
        setMessages(prev => (prev.some(m => m.id === data.id) ? prev : [...prev, data as ChatMessage]));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on failure
      setNewMessage(content);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping(); // Trigger typing indicator
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusColor = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'bg-gray-500';
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'on_break': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'Offline';
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      case 'on_break': return 'On Break';
      default: return 'Offline';
    }
  };

  // Chat View
  if (selectedMember) {
    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-3 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setSelectedMember(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {selectedMember.full_name?.split(' ').map(n => n[0]).join('') || '?'}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusColor(selectedMember.status, selectedMember.isOnline)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{selectedMember.full_name}</p>
            <p className={`text-xs ${selectedMember.isOnline ? 'text-green-400' : 'text-white/50'}`}>
              {getStatusText(selectedMember.status, selectedMember.isOnline)}
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-xs mt-1">Start a conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${isOwn
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white/10 text-white rounded-bl-md'
                        }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-white/40'}`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <div className="px-3 py-1">
              <TypingIndicator typingUsers={typingUsers} />
            </div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-3 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !newMessage.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600 text-white h-9 w-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Team List View
  return (
    <div className="space-y-2">
      {teamMembers.length === 0 ? (
        <div className="text-center py-4 text-white/50 text-sm">
          No team members found
        </div>
      ) : (
        teamMembers.map((member) => {
          const initials = member.full_name?.split(' ').map((n: string) => n[0]).join('') || '?';

          return (
            <button
              key={member.user_id}
              className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-left"
              onClick={() => setSelectedMember(member)}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-lg">
                  {initials}
                </div>
                {/* Online indicator */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${getStatusColor(member.status, member.isOnline)} ${member.isOnline ? 'animate-pulse' : ''}`}
                  title={getStatusText(member.status, member.isOnline)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{member.full_name}</p>
                <p className={`text-xs ${member.isOnline ? 'text-green-400' : 'text-white/50'}`}>
                  {getStatusText(member.status, member.isOnline)}
                </p>
              </div>
              <MessageCircle className="w-4 h-4 text-white/30" />
            </button>
          );
        })
      )}
    </div>
  );
};

export default TeamStatusSidebar;
