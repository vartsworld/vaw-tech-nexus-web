import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  created_at: string;
  assigned_to?: string;
  category?: string;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  profile_photo_url?: string;
  earnings: number;
  total_points: number;
  attendance_streak?: number;
  department_id?: string;
  role?: string;
  is_department_head?: boolean;
}

export const useStaffData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffData();
    
    // Subscribe to profile changes for real-time points/earnings updates
    const subscribeToProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const channel = supabase
        .channel('profile-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'staff_profiles',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setProfile(prev => prev ? {
            ...prev,
            earnings: Number(payload.new.earnings) || 0,
            total_points: payload.new.total_points || 0,
            attendance_streak: payload.new.attendance_streak || 0
          } : null);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    subscribeToProfile();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch Profile
      const { data: staffProfile, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const userProfile: Profile = {
        id: staffProfile.id,
        user_id: staffProfile.user_id,
        full_name: staffProfile.full_name,
        username: staffProfile.username,
        avatar_url: staffProfile.avatar_url,
        profile_photo_url: staffProfile.profile_photo_url,
        earnings: Number(staffProfile.earnings) || 0,
        total_points: staffProfile.total_points || 0,
        attendance_streak: staffProfile.attendance_streak || 0,
        department_id: staffProfile.department_id,
        role: staffProfile.role,
        is_department_head: staffProfile.is_department_head
      };
      setProfile(userProfile);

      // 2. Fetch Real Tasks
      const { data: realTasks, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(realTasks || []);

      // 3. Fetch Real Notes
      const { data: realNotes, error: notesError } = await supabase
        .from('staff_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!notesError) {
        setNotes(realNotes || []);
      }

      // 4. Fetch Chat Messages (Recent from General)
      const { data: genChannel } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('is_general', true)
        .single();

      if (genChannel) {
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            sender_id,
            created_at
          `)
          .eq('channel_id', genChannel.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!messagesError && messages) {
          // Format for ChatMessage interface
          const formattedMessages = await Promise.all(messages.map(async m => {
            const { data: sender } = await supabase
              .from('staff_profiles')
              .select('full_name, username')
              .eq('user_id', m.sender_id)
              .single();
              
            return {
              id: m.id,
              message: m.content,
              user_id: m.sender_id,
              created_at: m.created_at,
              profiles: sender ? {
                full_name: sender.full_name,
                username: sender.username
              } : undefined
            };
          }));
          setChatMessages(formattedMessages);
        }
      }

      // 5. Fetch Team Members
      if (staffProfile.department_id) {
        const { data: team, error: teamError } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('department_id', staffProfile.department_id)
          .neq('user_id', user.id);

        if (!teamError) {
          setTeamMembers(team.map(t => ({
            id: t.id,
            user_id: t.user_id,
            full_name: t.full_name,
            username: t.username,
            avatar_url: t.avatar_url,
            profile_photo_url: t.profile_photo_url,
            earnings: Number(t.earnings) || 0,
            total_points: t.total_points || 0,
            department_id: t.department_id
          })));
        }
      }

    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast({
        title: "Error",
        description: "Failed to load database data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({ status: status.toLowerCase().replace(' ', '_'), updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));

      if (status === 'Completed') {
        toast({
          title: "Task Completed! 🎉",
          description: "Great work! Coins will be awarded upon head approval.",
        });
      } else {
        toast({
          title: "Status Updated",
          description: `Task is now ${status}`,
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status in database",
        variant: "destructive"
      });
    }
  };

  const addNote = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('staff_notes')
        .insert({
          user_id: user.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      toast({
        title: "Note Saved",
        description: "Your note has been saved to the database.",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to save note to database",
        variant: "destructive"
      });
    }
  };

  const sendChatMessage = async (message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: genChannel } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('is_general', true)
        .single();

      if (!genChannel) throw new Error("General channel not found");

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content: message,
          sender_id: user.id,
          channel_id: genChannel.id
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: ChatMessage = {
        id: data.id,
        message: data.content,
        user_id: user.id,
        created_at: data.created_at,
        profiles: { 
          full_name: profile?.full_name || "Staff Member", 
          username: profile?.username || "staff" 
        }
      };

      setChatMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message to database",
        variant: "destructive"
      });
    }
  };

  return {
    tasks,
    notes,
    chatMessages,
    profile,
    teamMembers,
    loading,
    updateTaskStatus,
    addNote,
    sendChatMessage,
    refreshData: fetchStaffData
  };
};