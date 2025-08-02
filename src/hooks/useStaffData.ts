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
  earnings: number;
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
  }, []);

  const fetchStaffData = async () => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // Try to get actual staff profile, fallback to mock if not found
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const mockProfile: Profile = {
        id: user.id,
        user_id: user.id,
        full_name: staffProfile?.full_name || user.user_metadata?.full_name || 'Staff Member',
        username: staffProfile?.username || 'staff',
        earnings: 247.50
      };

      setProfile(mockProfile);

      // Mock tasks data
      const mockTasks: Task[] = [
        { 
          id: '1', 
          title: "Design new landing page", 
          description: "Create a modern landing page for the new product launch",
          priority: "High", 
          status: "In Progress", 
          due_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          assigned_to: user.id,
          category: "Design"
        },
        { 
          id: '2', 
          title: "Review client feedback", 
          description: "Go through client comments and prepare response",
          priority: "Medium", 
          status: "Pending", 
          due_date: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          assigned_to: user.id,
          category: "Review"
        },
        { 
          id: '3', 
          title: "Update documentation", 
          description: "Update API documentation with latest changes",
          priority: "Low", 
          status: "Pending", 
          due_date: new Date(Date.now() + 604800000).toISOString(),
          created_at: new Date().toISOString(),
          assigned_to: user.id,
          category: "Documentation"
        }
      ];

      setTasks(mockTasks);

      // Mock notes
      const mockNotes: Note[] = [
        { id: '1', content: "Meeting with client at 3 PM", created_at: new Date().toISOString() },
        { id: '2', content: "Review design mockups", created_at: new Date().toISOString() },
        { id: '3', content: "Submit timesheet by Friday", created_at: new Date().toISOString() }
      ];

      setNotes(mockNotes);

      // Mock chat messages
      const mockMessages: ChatMessage[] = [
        { 
          id: '1', 
          message: "Anyone up for a quick game?", 
          user_id: 'user-2', 
          created_at: new Date(Date.now() - 120000).toISOString(),
          profiles: { full_name: "Sarah Chen", username: "sarah" }
        },
        { 
          id: '2', 
          message: "Just finished my tasks! 🎉", 
          user_id: 'user-3', 
          created_at: new Date(Date.now() - 300000).toISOString(),
          profiles: { full_name: "Mike Rodriguez", username: "mike" }
        },
        { 
          id: '3', 
          message: "Coffee break time!", 
          user_id: 'user-4', 
          created_at: new Date(Date.now() - 600000).toISOString(),
          profiles: { full_name: "Emily Davis", username: "emily" }
        }
      ];

      setChatMessages(mockMessages);

      // Mock team members
      const mockTeam: Profile[] = [
        // Mock team members with username
        { id: 'user-2', user_id: 'user-2', full_name: "Sarah Chen", username: "sarah", earnings: 320.00 },
        { id: 'user-3', user_id: 'user-3', full_name: "Mike Rodriguez", username: "mike", earnings: 280.50 },
        { id: 'user-4', user_id: 'user-4', full_name: "Emily Davis", username: "emily", earnings: 195.75 }
      ];

      setTeamMembers(mockTeam);

    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      // Update task status locally
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));

      if (status === 'Completed') {
        // Update earnings locally for demo
        const task = tasks.find(t => t.id === taskId);
        const reward = task?.category === 'Design' ? 45 : task?.category === 'Review' ? 25 : 30;
        
        setProfile(prev => prev ? { 
          ...prev, 
          earnings: prev.earnings + reward 
        } : null);

        toast({
          title: "Task Completed! 🎉",
          description: `Earned $${reward}! Great work!`,
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const addNote = async (content: string) => {
    try {
      const newNote: Note = {
        id: Date.now().toString(),
        content,
        created_at: new Date().toISOString()
      };

      setNotes(prev => [newNote, ...prev]);
      toast({
        title: "Note Added",
        description: "Your note has been saved.",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    }
  };

  const sendChatMessage = async (message: string) => {
    try {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        user_id: profile?.user_id || '',
        created_at: new Date().toISOString(),
        profiles: { full_name: profile?.full_name || "Staff Member", username: profile?.username || "staff" }
      };

      setChatMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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