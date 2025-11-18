import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle,
  Clock,
  Plus,
  User,
  Target,
  AlertCircle,
  Calendar,
  Flag,
  ArrowRight,
  Users,
  Settings,
  StickyNote,
  Play,
  Pause,
  Loader2,
  Paperclip,
  Edit,
  Trash2,
  Download,
  X,
  Eye,
  FileText,
  Send
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffData } from "@/hooks/useStaffData";
import MusicPlayer from "./MusicPlayer";
import { TaskApprovalDialog } from "./TaskApprovalDialog";

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue' | 'pending_approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points: number;
  due_date?: string;
  due_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  attachments?: any;
  comments?: any;
  staff_profiles?: any;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue' | 'pending_approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  due_time?: string;
  trial_period?: boolean;
  attachments?: any[];
  comments?: any;
  points: number;
  assigned_to: string;
  assigned_by: string;
  department_id?: string;
  created_at: string;
  staff_profiles?: any;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Staff {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  department_id?: string;
}

interface TeamHeadWorkspaceProps {
  userId: string;
  userProfile: any;
}

const TeamHeadWorkspace = ({ userId, userProfile }: TeamHeadWorkspaceProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingSubtaskAttachment, setUploadingSubtaskAttachment] = useState<string | null>(null);
  const [newMessageTask, setNewMessageTask] = useState("");
  const [newMessageSubtask, setNewMessageSubtask] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    points: 0,
    due_date: "",
    due_time: ""
  });
  const [documentTitle, setDocumentTitle] = useState("");
  const [notes, setNotes] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    client_id: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    due_date: "",
    due_time: "",
    trial_period: false,
    points: 10,
    attachments: [] as Array<{ file: File; title: string }>
  });
  
  const [newClient, setNewClient] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [handoverData, setHandoverData] = useState({
    target_department: "",
    notes: ""
  });

  useEffect(() => {
    if (userProfile?.department_id) {
      fetchTasks();
    }
    fetchDepartments();
    fetchClients();
    fetchNotes();
  }, [userId, userProfile?.department_id]);

  // Fetch staff only when userProfile is loaded
  useEffect(() => {
    if (userProfile?.department_id) {
      fetchStaff();
    }
  }, [userId, userProfile?.department_id]);

  // Set up presence tracking for online users
  useEffect(() => {
    const channel = supabase.channel('team-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: userId,
            full_name: userProfile?.full_name || 'Unknown',
            username: userProfile?.username || 'unknown',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, userProfile]);

  const fetchTasks = async () => {
    try {
      // Fetch tasks assigned by/to team head OR tasks in their department
      const { data, error } = await supabase
        .from('staff_tasks')
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .or(`assigned_by.eq.${userId},assigned_to.eq.${userId},department_id.eq.${userProfile?.department_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched tasks with attachments:', data?.map(t => ({ 
        id: t.id, 
        title: t.title, 
        attachments: t.attachments,
        department_id: t.department_id
      })));
      
      // Cast attachments from Json to any[]
      const tasksWithAttachments = (data || []).map(task => ({
        ...task,
        attachments: task.attachments ? (task.attachments as any) : []
      }));
      
      setTasks(tasksWithAttachments as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      console.log('Fetching staff - userProfile:', {
        id: userProfile?.id,
        department_id: userProfile?.department_id,
        role: userProfile?.role,
        full_name: userProfile?.full_name
      });

      // Guard clause - don't show error if userProfile not loaded yet
      if (!userProfile?.department_id) {
        console.log('Waiting for userProfile to load...');
        return;
      }

      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, username, department_id, role')
        .eq('department_id', userProfile.department_id)
        .order('full_name');

      console.log('Staff fetch result:', { data, error, count: data?.length });

      if (error) throw error;
      setStaff(data || []);
      
      if (!data || data.length === 0) {
        console.warn('No staff members found in department:', userProfile.department_id);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, contact_person')
        .eq('status', 'active')
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchSubtasks = async (taskId: string) => {
    try {
      setLoadingSubtasks(true);
      const { data, error } = await supabase
        .from('staff_subtasks')
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const handleCreateSubtask = async (taskId: string) => {
    if (!newSubtask.title || !newSubtask.assigned_to) {
      toast({
        title: "Error",
        description: "Please fill in title and assignee.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff_subtasks')
        .insert({
          task_id: taskId,
          title: newSubtask.title,
          description: newSubtask.description,
          assigned_to: newSubtask.assigned_to,
          priority: newSubtask.priority,
          points: newSubtask.points || 0,
          due_date: newSubtask.due_date || null,
          due_time: newSubtask.due_time || null,
          created_by: userId,
          status: 'pending'
        })
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .single();

      if (error) {
        console.error('Subtask creation error:', error);
        throw error;
      }

      setSubtasks([data, ...subtasks]);
      setNewSubtask({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        points: 0,
        due_date: "",
        due_time: ""
      });

      toast({
        title: "Success",
        description: "Subtask created successfully.",
      });
    } catch (error: any) {
      console.error('Error creating subtask:', error);
      
      let errorMessage = "Failed to create subtask.";
      
      if (error.message) {
        if (error.message.includes('uuid')) {
          errorMessage = "Cannot save subtask: Invalid user ID format.";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Cannot save subtask: Invalid reference to task or user.";
        } else if (error.message.includes('violates')) {
          errorMessage = `Cannot save subtask: ${error.message}`;
        } else {
          errorMessage = `Cannot save subtask: ${error.message}`;
        }
      }
      
      toast({
        title: "Error Creating Subtask",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('staff_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) {
        toast({
          title: "Error deleting subtask",
          description: `${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setSubtasks(subtasks.filter(st => st.id !== subtaskId));

      toast({
        title: "Success",
        description: "Subtask deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete subtask.",
        variant: "destructive",
      });
    }
  };

  const handleSubtaskStatusUpdate = async (subtaskId: string, newStatus: string) => {
    try {
      // If staff is trying to mark as completed, change to pending_approval instead
      const finalStatus = newStatus === 'completed' ? 'pending_approval' : newStatus;
      
      const updateData: any = {
        status: finalStatus,
        updated_at: new Date().toISOString()
      };

      if (finalStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('staff_subtasks')
        .update(updateData)
        .eq('id', subtaskId)
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .single();

      if (error) {
        toast({
          title: "Error updating subtask",
          description: `${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setSubtasks(subtasks.map(st => st.id === subtaskId ? data : st));

      toast({
        title: "Success",
        description: finalStatus === 'pending_approval' 
          ? "Subtask submitted for admin approval" 
          : "Subtask status updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update subtask status.",
        variant: "destructive",
      });
    }
  };

  const handleSendSubtaskMessage = async (subtaskId: string, includeAttachment: boolean = false, file?: File) => {
    const message = newMessageSubtask[subtaskId] || "";
    if (!message.trim() && !includeAttachment) return;
    
    try {
      setUploadingSubtaskAttachment(subtaskId);
      
      let attachmentUrl = null;
      let attachmentName = null;
      
      if (includeAttachment && file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `subtasks/${subtaskId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(filePath);
          
        attachmentUrl = publicUrl;
        attachmentName = file.name;
      }
      
      const currentUser = await supabase.auth.getUser();
      const userProfile = await supabase
        .from('staff_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', currentUser.data.user?.id)
        .single();
      
      const newComment = {
        user_id: currentUser.data.user?.id,
        user_name: userProfile.data?.full_name || 'Unknown',
        user_avatar: userProfile.data?.avatar_url,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_name: attachmentName })
      };
      
      const { data: subtaskData } = await supabase
        .from('staff_subtasks')
        .select('comments')
        .eq('id', subtaskId)
        .single();
      
      const existingComments = (subtaskData?.comments as any[]) || [];
      const updatedComments = [...existingComments, newComment];
      
      const { error } = await supabase
        .from('staff_subtasks')
        .update({ comments: updatedComments })
        .eq('id', subtaskId);
        
      if (error) throw error;
      
      setSubtasks(subtasks.map(st => st.id === subtaskId ? { ...st, comments: updatedComments } : st));
      setNewMessageSubtask({ ...newMessageSubtask, [subtaskId]: "" });
      
      toast({ title: "Success", description: "Message sent successfully" });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setUploadingSubtaskAttachment(null);
    }
  };

  const handleAttachToSubtask = async (subtaskId: string, file: File) => {
    handleSendSubtaskMessage(subtaskId, true, file);
  };

  const handleSendTaskMessage = async (taskId: string, includeAttachment: boolean = false, file?: File) => {
    if (!selectedTask || (!newMessageTask.trim() && !includeAttachment)) return;
    
    try {
      setUploadingFiles(true);
      
      let attachmentUrl = null;
      let attachmentName = null;
      
      if (includeAttachment && file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `tasks/${taskId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(filePath);
          
        attachmentUrl = publicUrl;
        attachmentName = file.name;
      }
      
      const currentUser = await supabase.auth.getUser();
      const userProfile = await supabase
        .from('staff_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', currentUser.data.user?.id)
        .single();
      
      const newComment = {
        user_id: currentUser.data.user?.id,
        user_name: userProfile.data?.full_name || 'Unknown',
        user_avatar: userProfile.data?.avatar_url,
        message: newMessageTask.trim(),
        timestamp: new Date().toISOString(),
        ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_name: attachmentName })
      };
      
      const { data: taskData } = await supabase
        .from('staff_tasks')
        .select('comments')
        .eq('id', taskId)
        .single();
      
      const existingComments = (taskData?.comments as any[]) || [];
      const updatedComments = [...existingComments, newComment];
      
      const { error } = await supabase
        .from('staff_tasks')
        .update({ comments: updatedComments })
        .eq('id', taskId);
        
      if (error) throw error;
      
      setSelectedTask({ ...selectedTask, comments: updatedComments as any });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, comments: updatedComments as any } : t));
      setNewMessageTask("");
      
      toast({ title: "Success", description: "Message sent successfully" });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleAttachToTask = async (taskId: string, file: File) => {
    handleSendTaskMessage(taskId, true, file);
  };

  const handleAddClient = async () => {
    // Validate required fields
    if (!newClient.company_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newClient.contact_person.trim()) {
      toast({
        title: "Validation Error",
        description: "Contact person is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newClient.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate lengths
    if (newClient.company_name.trim().length > 200) {
      toast({
        title: "Validation Error",
        description: "Company name must be less than 200 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newClient.contact_person.trim().length > 200) {
      toast({
        title: "Validation Error",
        description: "Contact person must be less than 200 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newClient.email.trim().length > 255) {
      toast({
        title: "Validation Error",
        description: "Email must be less than 255 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: newClient.company_name.trim(),
          contact_person: newClient.contact_person.trim(),
          email: newClient.email.trim().toLowerCase(),
          phone: newClient.phone.trim() || null,
          address: newClient.address.trim() || null,
          notes: newClient.notes.trim() || null,
          created_by: userId,
          status: 'active'
        })
        .select('id, company_name, contact_person')
        .single();

      if (error) throw error;

      // Add to clients list
      setClients([...clients, data]);
      
      // Reset form
      setNewClient({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        notes: ""
      });
      
      setIsAddClientOpen(false);

      toast({
        title: "Success",
        description: "Client added successfully.",
      });

      // Auto-select the newly created client in the task form
      setNewTask({...newTask, client_id: data.id});

    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add client.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !newTask.client_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including client selection.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFiles(true);
      
      // First create the task
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        client_id: newTask.client_id,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        trial_period: newTask.trial_period,
        points: newTask.points,
        assigned_by: userId,
        department_id: userProfile?.department_id || null,
        status: 'pending' as const,
        attachments: []
      };

      const { data: taskResponse, error: taskError } = await supabase
        .from('staff_tasks')
        .insert(taskData)
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .single();

      if (taskError) throw taskError;

      // Cast and add to tasks
      const newTaskData = {
        ...taskResponse,
        attachments: taskResponse.attachments ? (taskResponse.attachments as any) : []
      } as Task;

      // Upload files if any
      const attachmentData = [];
      if (newTask.attachments.length > 0) {
        console.log('Uploading attachments:', newTask.attachments.length, 'files');
        for (const attachment of newTask.attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const filePath = `${taskResponse.id}/${Date.now()}.${fileExt}`;
          
          console.log('Uploading file:', attachment.file.name, 'to:', filePath);
          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, attachment.file);

          if (uploadError) {
            console.error('Upload error for', attachment.file.name, ':', uploadError);
            toast({
              title: "Warning",
              description: `Failed to upload ${attachment.file.name}`,
              variant: "destructive",
            });
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('task-attachments')
              .getPublicUrl(filePath);

            console.log('File uploaded successfully:', publicUrl);
            attachmentData.push({
              title: attachment.title || attachment.file.name,
              name: attachment.file.name,
              url: filePath,
              publicUrl: publicUrl,
              size: attachment.file.size,
              type: attachment.file.type
            });
          }
        }

        if (attachmentData.length > 0) {
          console.log('Updating task with attachments:', attachmentData);
          // Update task with attachment info
          const { error: updateError } = await supabase
            .from('staff_tasks')
            .update({ attachments: attachmentData })
            .eq('id', taskResponse.id);

          if (updateError) {
            console.error('Error updating task with attachments:', updateError);
          }

          newTaskData.attachments = attachmentData;
        }
      } else {
        console.log('No attachments to upload');
      }

      setTasks([newTaskData, ...tasks]);
      setIsCreateTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        client_id: "",
        priority: "medium",
        due_date: "",
        due_time: "",
        trial_period: false,
        points: 10,
        attachments: []
      });

      toast({
        title: "Success",
        description: "Task created successfully.",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    
    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({
          title: selectedTask.title,
          description: selectedTask.description,
          assigned_to: selectedTask.assigned_to,
          priority: selectedTask.priority,
          due_date: selectedTask.due_date || null,
          due_time: selectedTask.due_time || null,
          trial_period: selectedTask.trial_period,
          points: selectedTask.points
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === selectedTask.id ? selectedTask : t));
      setIsEditTaskOpen(false);
      setSelectedTask(null);

      toast({
        title: "Success",
        description: "Task updated successfully.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      // Delete attachments from storage
      if (selectedTask.attachments && selectedTask.attachments.length > 0) {
        const filePaths = selectedTask.attachments.map((att: any) => att.url);
        await supabase.storage
          .from('task-attachments')
          .remove(filePaths);
      }

      // Delete task
      const { error } = await supabase
        .from('staff_tasks')
        .delete()
        .eq('id', selectedTask.id);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== selectedTask.id));
      setIsDeleteDialogOpen(false);
      setSelectedTask(null);

      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // If staff is trying to mark as completed, change to pending_approval instead
      const finalStatus = newStatus === 'completed' ? 'pending_approval' : newStatus;
      
      const updateData: any = {
        status: finalStatus,
        updated_at: new Date().toISOString()
      };

      if (finalStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('staff_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .single();

      if (error) throw error;

      const updatedTask = {
        ...data,
        attachments: data.attachments ? (data.attachments as any) : []
      } as Task;

      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));

      toast({
        title: "Success",
        description: finalStatus === 'pending_approval' 
          ? "Task submitted for admin approval" 
          : "Task status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  const handleHandoverTask = async () => {
    if (!selectedTask) return;

    try {
      // Get target department name
      const targetDept = departments.find(d => d.id === handoverData.target_department);
      
      // Get current department name
      const currentDept = departments.find(d => d.id === selectedTask.department_id);
      
      // Create handover history comment
      const handoverComment = {
        type: 'handover',
        user_name: userProfile?.full_name || 'Unknown',
        user_avatar: userProfile?.avatar_url || null,
        timestamp: new Date().toISOString(),
        message: handoverData.notes || 'Task handed over',
        from_department: currentDept?.name || 'Unknown',
        to_department: targetDept?.name || 'Unknown',
        from_department_id: selectedTask.department_id,
        to_department_id: handoverData.target_department
      };

      // Get existing comments and add handover history
      const existingComments = selectedTask.comments || [];
      const updatedComments = [...existingComments, handoverComment];

      const { error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'handover',
          department_id: handoverData.target_department,
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, status: 'handover' as const, department_id: handoverData.target_department, comments: updatedComments }
          : task
      ));

      setIsHandoverOpen(false);
      setSelectedTask(null);
      setHandoverData({ target_department: "", notes: "" });

      toast({
        title: "Success",
        description: "Task handed over successfully.",
      });
    } catch (error) {
      console.error('Error handing over task:', error);
      toast({
        title: "Error",
        description: "Failed to handover task.",
        variant: "destructive",
      });
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const { error } = await supabase
        .from('quick_notes')
        .insert([
          {
            user_id: userId,
            content: newNote.trim()
          }
        ]);

      if (error) throw error;

      setNewNote("");
      await fetchNotes();
      toast({
        title: "Success",
        description: "Note added successfully.",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('quick_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      await fetchNotes();
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTaskAttachment = async (attachmentUrl: string, attachmentIndex: number) => {
    if (!selectedTask) return;
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachmentUrl]);

      if (storageError) throw storageError;

      // Update task attachments
      const updatedAttachments = selectedTask.attachments?.filter((_, idx) => idx !== attachmentIndex) || [];
      
      const { error: dbError } = await supabase
        .from('staff_tasks')
        .update({ attachments: updatedAttachments })
        .eq('id', selectedTask.id);

      if (dbError) throw dbError;

      setSelectedTask({ ...selectedTask, attachments: updatedAttachments });
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, attachments: updatedAttachments } : t));

      toast({
        title: "Success",
        description: "Attachment deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: "Failed to delete attachment.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTaskCommentAttachment = async (commentIndex: number) => {
    if (!selectedTask) return;
    
    try {
      const comments = selectedTask.comments || [];
      const comment = comments[commentIndex];
      
      if (!comment.attachment_url) return;

      // Extract storage path from public URL
      const urlParts = comment.attachment_url.split('/task-attachments/');
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        
        // Delete from storage
        await supabase.storage
          .from('task-attachments')
          .remove([storagePath]);
      }

      // Update comment to remove attachment
      const updatedComments = comments.map((c, idx) => 
        idx === commentIndex 
          ? { ...c, attachment_url: null, attachment_name: null }
          : c
      );

      const { error } = await supabase
        .from('staff_tasks')
        .update({ comments: updatedComments })
        .eq('id', selectedTask.id);

      if (error) throw error;

      setSelectedTask({ ...selectedTask, comments: updatedComments as any });
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, comments: updatedComments as any } : t));

      toast({
        title: "Success",
        description: "Attachment deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting comment attachment:', error);
      toast({
        title: "Error",
        description: "Failed to delete attachment.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubtaskCommentAttachment = async (subtaskId: string, commentIndex: number) => {
    try {
      const subtask = subtasks.find(st => st.id === subtaskId);
      if (!subtask) return;
      
      const comments = subtask.comments || [];
      const comment = comments[commentIndex];
      
      if (!comment.attachment_url) return;

      // Extract storage path from public URL
      const urlParts = comment.attachment_url.split('/task-attachments/');
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        
        // Delete from storage
        await supabase.storage
          .from('task-attachments')
          .remove([storagePath]);
      }

      // Update comment to remove attachment
      const updatedComments = comments.map((c, idx) => 
        idx === commentIndex 
          ? { ...c, attachment_url: null, attachment_name: null }
          : c
      );

      const { error } = await supabase
        .from('staff_subtasks')
        .update({ comments: updatedComments })
        .eq('id', subtaskId);

      if (error) throw error;

      setSubtasks(subtasks.map(st => st.id === subtaskId ? { ...st, comments: updatedComments } : st));

      toast({
        title: "Success",
        description: "Attachment deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting subtask comment attachment:', error);
      toast({
        title: "Error",
        description: "Failed to delete attachment.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Target },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      handover: { color: 'bg-purple-100 text-purple-800', icon: ArrowRight },
      pending_approval: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={priorityConfig[priority] || priorityConfig.medium}>
        <Flag className="h-3 w-3 mr-1" />
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-white">Team Head Workspace</h2>
        </div>
        <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => setNewTask({...newTask, assigned_to: userId})}
                    >
                      <User className="h-3 w-3 mr-1" />
                      Assign to myself
                    </Button>
                  </div>
                  <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({...newTask, assigned_to: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(member => (
                        <SelectItem key={member.id} value={member.user_id}>
                          {member.full_name} (@{member.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="client">Client *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => setIsAddClientOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add New Client
                    </Button>
                  </div>
                  <Select value={newTask.client_id} onValueChange={(value) => setNewTask({...newTask, client_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name} - {client.contact_person}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newTask.points}
                      onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 10})}
                      min="1"
                      max="100"
                      disabled={newTask.trial_period}
                      className={newTask.trial_period ? 'opacity-50' : ''}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="space-y-0.5">
                    <Label htmlFor="trial_period" className="text-sm font-medium">
                      Trial Period
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Staff won't earn points for this task
                    </p>
                  </div>
                  <Switch
                    id="trial_period"
                    checked={newTask.trial_period}
                    onCheckedChange={(checked) => setNewTask({...newTask, trial_period: checked})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Due Date (Optional)</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_time">Due Time (Optional)</Label>
                    <Input
                      id="due_time"
                      type="time"
                      value={newTask.due_time}
                      onChange={(e) => setNewTask({...newTask, due_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="attachments">Attachments (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const attachmentsWithTitles = files.map(file => ({
                          file,
                          title: file.name.split('.')[0] // Default title is filename without extension
                        }));
                        setNewTask({...newTask, attachments: [...newTask.attachments, ...attachmentsWithTitles]});
                        e.target.value = ''; // Reset input
                      }}
                      className="cursor-pointer"
                    />
                    {newTask.attachments.length > 0 && (
                      <div className="space-y-2">
                        {newTask.attachments.map((attachment, idx) => (
                          <div key={idx} className="p-3 bg-white/5 rounded border border-white/10 space-y-2">
                            <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Paperclip className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate text-sm">{attachment.file.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  ({(attachment.file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newFiles = newTask.attachments.filter((_, i) => i !== idx);
                                  setNewTask({...newTask, attachments: newFiles});
                                }}
                                className="self-end sm:self-auto"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div>
                              <Label htmlFor={`title-${idx}`} className="text-xs">Document Title</Label>
                              <Input
                                id={`title-${idx}`}
                                value={attachment.title}
                                onChange={(e) => {
                                  const updatedAttachments = [...newTask.attachments];
                                  updatedAttachments[idx].title = e.target.value;
                                  setNewTask({...newTask, attachments: updatedAttachments});
                                }}
                                placeholder="Enter document title"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-white/10">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateTaskOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask} 
                disabled={uploadingFiles}
                className="w-full sm:w-auto"
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approval Tasks */}
          {tasks.filter(t => t.status === 'pending_approval').length > 0 && (
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg border-orange-500/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 h-5 text-orange-400" />
                  Pending Approval ({tasks.filter(t => t.status === 'pending_approval').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === 'pending_approval').map((task) => (
                    <div key={task.id} className="bg-black/30 border border-orange-500/30 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white mb-1">{task.title}</h4>
                          {task.description && (
                            <p className="text-white/70 text-sm line-clamp-2 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-white/60">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.staff_profiles?.full_name || 'Unknown'}
                            </div>
                            {task.due_date && task.due_date.trim() !== '' && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {(() => {
                                  try {
                                    const date = new Date(task.due_date);
                                    if (isNaN(date.getTime())) return 'Invalid date';
                                    return format(date, 'MMM dd, yyyy');
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </div>
                            )}
                            {task.attachments && task.attachments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {task.attachments.length} file(s)
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsApprovalOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-black/20 backdrop-blur-lg border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Team Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/80">Task</TableHead>
                      <TableHead className="text-white/80">Assigned To</TableHead>
                      <TableHead className="text-white/80">Status</TableHead>
                      <TableHead className="text-white/80">Priority</TableHead>
                      <TableHead className="text-white/80 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-white/60 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                            {task.trial_period && (
                              <Badge variant="outline" className="text-xs mt-1 bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                                Trial Period
                              </Badge>
                            )}
                            {(task.due_date || task.due_time) && (
                              <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {task.due_date && task.due_date.trim() !== '' && (() => {
                                  try {
                                    const date = new Date(task.due_date);
                                    if (isNaN(date.getTime())) return 'Invalid date';
                                    return format(date, 'MMM dd, yyyy');
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                                {task.due_time && ` at ${task.due_time}`}
                              </div>
                            )}
                            {task.attachments && task.attachments.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-blue-300">
                                <Paperclip className="h-3 w-3" />
                                {task.attachments.length} file(s)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-white/40" />
                            <div>
                              <div className="font-medium text-white/90">
                                {task.staff_profiles?.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-white/50">
                                @{task.staff_profiles?.username || 'unknown'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.status)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(task.priority)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleTaskStatusUpdate(task.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                setSelectedTask(task);
                                await fetchSubtasks(task.id);
                                setIsViewTaskOpen(true);
                              }}
                              title="View details and subtasks"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsEditTaskOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>

                            {task.status !== 'handover' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsHandoverOpen(true);
                                }}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notes */}
          <Card className="bg-black/20 backdrop-blur-lg border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-yellow-400" />
                Quick Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a quick note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!newNote.trim() || addingNote}
                  size="sm"
                  className="w-full"
                >
                  {addingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="p-2 bg-white/5 rounded-lg border border-white/10 group relative">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <X className="h-3 w-3 text-white/70" />
                      </Button>
                      <p className="text-sm text-white/80 pr-6">{note.content}</p>
                      <p className="text-xs text-white/50 mt-1">
                        {format(new Date(note.created_at), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Music Player */}
          <Card className="bg-black/20 backdrop-blur-lg border-white/10 text-white">
            <CardContent className="pt-6">
              <MusicPlayer />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Handover Dialog */}
      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_title">Task Title</Label>
                <Input
                  id="edit_title"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={selectedTask.description}
                  onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_assigned_to">Reassign To</Label>
                <Select 
                  value={selectedTask.assigned_to} 
                  onValueChange={(value) => setSelectedTask({...selectedTask, assigned_to: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>
                        {s.full_name} (@{s.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_priority">Priority</Label>
                  <Select 
                    value={selectedTask.priority} 
                    onValueChange={(value) => setSelectedTask({...selectedTask, priority: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_points">Points</Label>
                  <Input
                    id="edit_points"
                    type="number"
                    value={selectedTask.points}
                    onChange={(e) => setSelectedTask({...selectedTask, points: parseInt(e.target.value) || 10})}
                    min="1"
                    max="100"
                    disabled={selectedTask.trial_period}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-0.5">
                  <Label htmlFor="edit_trial" className="text-sm font-medium">Trial Period</Label>
                  <p className="text-xs text-muted-foreground">Staff won't earn points</p>
                </div>
                <Switch
                  id="edit_trial"
                  checked={selectedTask.trial_period}
                  onCheckedChange={(checked) => setSelectedTask({...selectedTask, trial_period: checked})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_due_date">Due Date</Label>
                  <Input
                    id="edit_due_date"
                    type="date"
                    value={selectedTask.due_date || ''}
                    onChange={(e) => setSelectedTask({...selectedTask, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_due_time">Due Time</Label>
                  <Input
                    id="edit_due_time"
                    type="time"
                    value={selectedTask.due_time || ''}
                    onChange={(e) => setSelectedTask({...selectedTask, due_time: e.target.value})}
                  />
                </div>
              </div>
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <Label>Attachments</Label>
                  <div className="space-y-1 mt-2">
                    {selectedTask.attachments.map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10 text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const { data } = await supabase.storage
                                .from('task-attachments')
                                .download(att.url);
                              if (data) {
                                const url = URL.createObjectURL(data);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = att.name;
                                a.click();
                              }
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTaskAttachment(att.url, idx)}
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTask}>
                  Update Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone and will also delete all attached files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Handover Task Dialog */}
      <Dialog open={isHandoverOpen} onOpenChange={setIsHandoverOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Handover Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task: {selectedTask?.title}</Label>
            </div>
            <div>
              <Label htmlFor="target_department">Target Department</Label>
              <Select 
                value={handoverData.target_department} 
                onValueChange={(value) => setHandoverData({...handoverData, target_department: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Handover Notes</Label>
              <Textarea
                id="notes"
                value={handoverData.notes}
                onChange={(e) => setHandoverData({...handoverData, notes: e.target.value})}
                placeholder="Add any notes for the receiving department..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsHandoverOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleHandoverTask}>
                Handover Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Task Details Dialog */}
      <Dialog open={isViewTaskOpen} onOpenChange={setIsViewTaskOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              {/* Task Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedTask.status)}
                  {getPriorityBadge(selectedTask.priority)}
                  {selectedTask.trial_period && (
                    <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                      Trial Period
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assigned to:</span>{' '}
                    <span className="font-medium">{selectedTask.staff_profiles?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Points:</span>{' '}
                    <span className="font-medium">{selectedTask.points}</span>
                  </div>
                  {selectedTask.due_date && selectedTask.due_date.trim() !== '' && (
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>{' '}
                      <span className="font-medium">
                        {(() => {
                          try {
                            const date = new Date(selectedTask.due_date);
                            if (isNaN(date.getTime())) return 'Invalid date';
                            return format(date, 'MMM dd, yyyy');
                          } catch {
                            return 'Invalid date';
                          }
                        })()}
                      </span>
                      {selectedTask.due_time && <span> at {selectedTask.due_time}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Task Attachments */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <Paperclip className="h-4 w-4" />
                    Task Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTask.attachments.map((attachment: any, idx: number) => (
                      <a
                        key={idx}
                        href={attachment.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.title || attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Handover History */}
              {selectedTask.comments && selectedTask.comments.some((c: any) => c.type === 'handover') && (
                <div className="mb-6">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <ArrowRight className="h-4 w-4" />
                    Handover History
                  </h4>
                  <div className="space-y-2">
                    {selectedTask.comments
                      .filter((c: any) => c.type === 'handover')
                      .map((handover: any, idx: number) => (
                        <div key={idx} className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{handover.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(handover.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">From:</span>{' '}
                                <Badge variant="outline" className="text-xs">
                                  {handover.from_department}
                                </Badge>
                                {' → '}
                                <span className="text-muted-foreground">To:</span>{' '}
                                <Badge variant="outline" className="text-xs">
                                  {handover.to_department}
                                </Badge>
                              </div>
                              {handover.message && handover.message !== 'Task handed over' && (
                                <p className="text-sm text-muted-foreground italic">
                                  Note: {handover.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Messages & Attachments */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  Messages & Comments
                </h4>
                
                {selectedTask.comments && selectedTask.comments.filter((c: any) => c.type !== 'handover').length > 0 && (
                  <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                    {selectedTask.comments
                      .filter((c: any) => c.type !== 'handover')
                      .map((comment: any, idx: number) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2">
                          <div className="flex items-start gap-2">
                            {comment.user_avatar && (
                              <img src={comment.user_avatar} alt="" className="w-6 h-6 rounded-full" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{comment.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {comment.message && (
                                <p className="text-sm mt-1">{comment.message}</p>
                              )}
                              {comment.attachment_url && (
                                <div className="flex items-center justify-between mt-2 p-2 bg-white/5 rounded border border-white/10">
                                  <a
                                    href={comment.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    {comment.attachment_name}
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTaskCommentAttachment(idx)}
                                  >
                                    <X className="h-3 w-3 text-red-400" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessageTask}
                    onChange={(e) => setNewMessageTask(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="icon"
                      onClick={() => selectedTask && handleSendTaskMessage(selectedTask.id, false)}
                      disabled={!newMessageTask.trim() || uploadingFiles}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      id="task-attachment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedTask) {
                          handleAttachToTask(selectedTask.id, file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => document.getElementById('task-attachment')?.click()}
                      disabled={uploadingFiles}
                    >
                      {uploadingFiles ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subtasks Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Subtasks
                    {subtasks.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {subtasks.filter(st => st.status === 'completed').length}/{subtasks.length} Completed
                      </Badge>
                    )}
                  </h4>
                </div>

                {/* Create Subtask Form */}
                <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                  <h5 className="font-medium text-sm">Create Subtask</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Input
                        placeholder="Subtask title *"
                        value={newSubtask.title}
                        onChange={(e) => setNewSubtask({...newSubtask, title: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Textarea
                        placeholder="Description (optional)"
                        value={newSubtask.description}
                        onChange={(e) => setNewSubtask({...newSubtask, description: e.target.value})}
                        rows={2}
                      />
                    </div>
                    <Select 
                      value={newSubtask.assigned_to} 
                      onValueChange={(value) => setNewSubtask({...newSubtask, assigned_to: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to *" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map(member => (
                          <SelectItem key={member.id} value={member.user_id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={newSubtask.priority} 
                      onValueChange={(value) => setNewSubtask({...newSubtask, priority: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Points (optional)"
                      value={newSubtask.points === 0 ? "" : newSubtask.points}
                      onChange={(e) => setNewSubtask({...newSubtask, points: parseInt(e.target.value) || 0})}
                      min="0"
                      max="50"
                    />
                    <div></div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newSubtask.due_date && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {newSubtask.due_date && newSubtask.due_date.trim() !== '' ? (
                            (() => {
                              try {
                                const date = new Date(newSubtask.due_date);
                                if (isNaN(date.getTime())) return <span>Pick due date (optional)</span>;
                                return format(date, "PPP");
                              } catch {
                                return <span>Pick due date (optional)</span>;
                              }
                            })()
                          ) : (
                            <span>Pick due date (optional)</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={(() => {
                            if (!newSubtask.due_date || newSubtask.due_date.trim() === '') return undefined;
                            try {
                              const date = new Date(newSubtask.due_date);
                              return isNaN(date.getTime()) ? undefined : date;
                            } catch {
                              return undefined;
                            }
                          })()}
                          onSelect={(date) => setNewSubtask({...newSubtask, due_date: date ? format(date, "yyyy-MM-dd") : ""})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Select
                      value={newSubtask.due_time}
                      onValueChange={(value) => setNewSubtask({...newSubtask, due_time: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-60">
                          {Array.from({ length: 24 * 4 }, (_, i) => {
                            const hour = Math.floor(i / 4);
                            const minute = (i % 4) * 15;
                            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                            return (
                              <SelectItem key={timeString} value={timeString}>
                                {displayTime}
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => handleCreateSubtask(selectedTask.id)}
                      className="col-span-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subtask
                    </Button>
                  </div>
                </div>

                {/* Subtasks List */}
                {loadingSubtasks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{subtask.title}</span>
                              {getPriorityBadge(subtask.priority)}
                            </div>
                            {subtask.description && (
                              <p className="text-sm text-muted-foreground mb-2">{subtask.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>Assigned to: {subtask.staff_profiles?.full_name}</span>
                              {subtask.points > 0 && <span>Points: {subtask.points}</span>}
                              {subtask.due_date && subtask.due_date.trim() !== '' && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {(() => {
                                    try {
                                      const date = new Date(subtask.due_date);
                                      if (isNaN(date.getTime())) return 'Invalid date';
                                      return format(date, 'MMM dd, yyyy');
                                    } catch {
                                      return 'Invalid date';
                                    }
                                  })()}
                                  {subtask.due_time && ` at ${subtask.due_time}`}
                                </span>
                              )}
                            </div>
                            {subtask.comments && subtask.comments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {subtask.comments.map((comment: any, idx: number) => (
                                  <div key={idx} className="bg-muted/50 p-2 rounded text-xs space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{comment.user_name}</span>
                                      <span className="text-muted-foreground">
                                        {new Date(comment.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                    {comment.message && <p>{comment.message}</p>}
                                    {comment.attachment_url && (
                                      <div className="flex items-center justify-between p-1 bg-white/5 rounded border border-white/10">
                                        <a
                                          href={comment.attachment_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          {comment.attachment_name}
                                        </a>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => handleDeleteSubtaskCommentAttachment(subtask.id, idx)}
                                        >
                                          <X className="h-3 w-3 text-red-400" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="mt-2 flex gap-2">
                              <Textarea
                                placeholder="Type a message..."
                                value={newMessageSubtask[subtask.id] || ""}
                                onChange={(e) => setNewMessageSubtask({ ...newMessageSubtask, [subtask.id]: e.target.value })}
                                className="flex-1 text-sm"
                                rows={1}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleSendSubtaskMessage(subtask.id, false)}
                                disabled={!newMessageSubtask[subtask.id]?.trim() || uploadingSubtaskAttachment === subtask.id}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleAttachToSubtask(subtask.id, file);
                                  e.target.value = '';
                                }}
                                className="hidden"
                                id={`subtask-file-${subtask.id}`}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => document.getElementById(`subtask-file-${subtask.id}`)?.click()}
                                disabled={uploadingSubtaskAttachment === subtask.id}
                              >
                                {uploadingSubtaskAttachment === subtask.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Paperclip className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={subtask.status}
                              onValueChange={(value) => handleSubtaskStatusUpdate(subtask.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              title="Delete subtask"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No subtasks yet. Create one above to get started.
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewTaskOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={newClient.company_name}
                onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                placeholder="Enter company name"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                value={newClient.contact_person}
                onChange={(e) => setNewClient({...newClient, contact_person: e.target.value})}
                placeholder="Enter contact person name"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                placeholder="Enter email address"
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                placeholder="Enter phone number"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newClient.address}
                onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                placeholder="Enter address"
                rows={2}
                maxLength={500}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newClient.notes}
                onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                placeholder="Enter any additional notes"
                rows={2}
                maxLength={1000}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient}>
                Add Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TaskApprovalDialog
        task={selectedTask}
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        onApproved={() => {
          fetchTasks();
          setSelectedTask(null);
        }}
      />
    </div>
  );
};

export default TeamHeadWorkspace;