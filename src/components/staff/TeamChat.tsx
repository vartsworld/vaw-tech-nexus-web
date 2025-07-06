import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Hash, Users, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  channel_id?: string;
  recipient_id?: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  is_general: boolean;
}

interface TeamChatProps {
  userId: string;
  userProfile: any;
}

const TeamChat = ({ userId, userProfile }: TeamChatProps) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .order('name');

      if (error) throw error;

      setChannels(data || []);
      
      // Set general channel as default
      const generalChannel = data?.find(c => c.is_general);
      if (generalChannel) {
        setActiveChannelId(generalChannel.id);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchMessages = async () => {
    if (!activeChannelId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *
        `)
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Get sender info separately for now
      const messagesWithSender = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('staff_profiles')
            .select('full_name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();
            
          return {
            ...msg,
            sender_name: senderData?.full_name || 'Unknown User',
            sender_avatar: senderData?.avatar_url
          };
        })
      );

      setMessages(messagesWithSender);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`chat-${activeChannelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${activeChannelId}`
      }, (payload) => {
        fetchMessages(); // Refetch to get sender info
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannelId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage.trim(),
          sender_id: userId,
          channel_id: activeChannelId
        });

      if (error) throw error;

      // Award points for chat engagement
      await supabase
        .from('user_points_log')
        .insert({
          user_id: userId,
          points: 2,
          reason: 'Chat Message Sent',
          category: 'chat_engagement'
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Team Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Channel Tabs */}
        <div className="flex gap-1 px-4 mb-4 overflow-x-auto">
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant={activeChannelId === channel.id ? "default" : "ghost"}
              size="sm"
              className={`flex items-center gap-1 whitespace-nowrap ${
                activeChannelId === channel.id
                  ? "bg-blue-500 text-white"
                  : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveChannelId(channel.id)}
            >
              {channel.is_general ? <Hash className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              {channel.name}
            </Button>
          ))}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === userId;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {message.sender_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs text-white/70 font-medium">
                          {message.sender_name}
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-white/70' : 'text-white/50'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-white/20 mt-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !newMessage.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-white/50">
            <span>Press Enter to send</span>
            <span>+2 points per message</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamChat;