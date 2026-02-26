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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  Send,
  Filter,
  LayoutDashboard,
  LayoutGrid,
  List,
  MoreVertical,
  Search,
  ChevronDown,
  Check,
  LayoutTemplate,
  ChevronRight,
  ListChecks
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffData } from "@/hooks/useStaffData";

import { TaskApprovalDialog } from "./TaskApprovalDialog";
import ClientOnboardingCreator from "./ClientOnboardingCreator";

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue' | 'pending_approval' | 'review_pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points: number;
  due_date?: string;
  due_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  approved_at?: string | null;
  approved_by?: string | null;
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
  avatar_url?: string | null;
  role?: string | null;
}

interface TeamHeadWorkspaceProps {
  userId: string;
  userProfile: any;
  widgetManager?: React.ReactNode;
}

const TeamHeadWorkspace = ({ userId, userProfile, widgetManager }: TeamHeadWorkspaceProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
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
  const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Subtask[]>([]);
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
    assigned_to: [] as string[],
    client_id: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    due_date: "",
    due_time: "",
    trial_period: false,
    points: 10,
    attachments: [] as Array<{ file: File; title: string }>
  });

  const [taskTemplates, setTaskTemplates] = useState<any[]>([]);
  const [subtaskTemplates, setSubtaskTemplates] = useState<any[]>([]);
  const [selectedTaskTemplateId, setSelectedTaskTemplateId] = useState<string>("none");
  const [selectedSubtaskTemplateId, setSelectedSubtaskTemplateId] = useState<string>("none");
  const [bulkSubtasks, setBulkSubtasks] = useState<any[]>([]);

  // Helper: parse assigned_to which may be a plain UUID or a JSON array string
  const parseAssignedTo = (val: string | null | undefined): string[] => {
    if (!val) return [];
    const trimmed = val.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [val];
      } catch {
        return [val];
      }
    }
    return [val];
  };

  // Helper: resolve assignee data from staff list (supports multi-assign)
  const getAssigneeProfiles = (assignedTo: string): Staff[] => {
    const ids = parseAssignedTo(assignedTo);
    if (ids.length === 0) return [];
    return staff.filter((s) => ids.includes(s.user_id));
  };

  const getAssigneeName = (assignedTo: string): string => {
    const assignees = getAssigneeProfiles(assignedTo);
    if (assignees.length === 0) return "Unassigned";
    if (assignees.length === 1) return assignees[0].full_name;
    const [first, ...rest] = assignees;
    return `${first.full_name} + ${rest.length} more`;
  };

  const getAssigneeUsername = (assignedTo: string): string => {
    const ids = parseAssignedTo(assignedTo);
    if (ids.length === 0) return "unknown";
    const first = staff.find((s) => s.user_id === ids[0]);
    return first?.username || "unknown";
  };

  const getAssigneeCount = (assignedTo: string): number => {
    return parseAssignedTo(assignedTo).length;
  };

  const getCreatorName = (assignedBy: string | null | undefined): string => {
    if (!assignedBy) return "Unknown";
    const creator = staff.find((s) => s.user_id === assignedBy);
    return creator?.full_name || "Unknown";
  };

  // Fetch all subtasks in pending_approval that belong to tasks in this head's department
  const fetchPendingSubtasksForTasks = async () => {
    if (!userProfile?.department_id) {
      setPendingSubtasks([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("staff_subtasks")
        .select(
          `
          *,
          staff_tasks!inner (
            id,
            title,
            department_id,
            status,
            assigned_to,
            assigned_by,
            priority,
            points
          ),
          staff_profiles:assigned_to (
            full_name,
            username,
            avatar_url,
            role
          )
        `
        )
        .eq("status", "pending_approval" as any)
        .eq("staff_tasks.department_id", userProfile.department_id as any);

      if (error) throw error;
      setPendingSubtasks((data || []) as any);
    } catch (error) {
      console.error("Error fetching pending subtasks:", error);
    }
  };

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
    fetchTaskTemplates();
    fetchSubtaskTemplates();
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

  // Real-time task updates
  useEffect(() => {
    if (!userProfile?.department_id) return;

    const channel = supabase
      .channel('team-head-tasks-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'staff_tasks',
        filter: `department_id=eq.${userProfile.department_id}`
      }, (payload) => {
        console.log('Task update received, refreshing tasks...', payload);
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.department_id]);

  const fetchTasks = async () => {
    try {
      // Fetch tasks assigned by/to team head OR tasks in their department
      // NOTE: assigned_to is now TEXT (not UUID FK) to support multi-assign JSON arrays
      const { data, error } = await supabase
        .from('staff_tasks')
        .select('*')
        .or(`assigned_by.eq.${userId},assigned_to.eq.${userId},assigned_to.like.*${userId}*,department_id.eq.${userProfile?.department_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched tasks:', data?.length);

      // Cast attachments from Json to any[]
      const tasksWithAttachments = (data || []).map(task => ({
        ...task,
        attachments: task.attachments ? (task.attachments as any) : []
      }));

      setTasks(tasksWithAttachments as Task[]);

      // Also fetch subtasks that are pending approval for tasks in this head's department
      await fetchPendingSubtasksForTasks();
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
        .select('id, user_id, full_name, username, department_id, role, avatar_url')
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

  const fetchTaskTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*, subtask_templates (*)')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setTaskTemplates(data || []);
    } catch (error) {
      console.error('Error fetching task templates:', error);
    }
  };

  const fetchSubtaskTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('subtask_templates')
        .select('*')
        .order('title');

      if (error) throw error;
      setSubtaskTemplates(data || []);
    } catch (error) {
      console.error('Error fetching subtask templates:', error);
    }
  };

  const handleBulkAddSubtasks = async () => {
    if (!selectedTask || bulkSubtasks.length === 0) return;

    const unassigned = bulkSubtasks.some(st => !st.assigned_to);
    if (unassigned) {
      toast({
        title: "Incomplete Assignment",
        description: "Please assign all subtasks from the template before adding.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subtasksToInsert = bulkSubtasks.map(st => ({
        task_id: selectedTask.id,
        title: st.title,
        description: st.description,
        assigned_to: st.assigned_to,
        priority: st.priority || 'medium',
        points: st.points || 0,
        stage: (st as any).stage ?? 1,
        created_by: user.id,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('staff_subtasks')
        .insert(subtasksToInsert)
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `);

      if (error) throw error;

      setSubtasks([...(data || []), ...subtasks]);
      setBulkSubtasks([]);
      setSelectedTaskTemplateId("none");

      toast({
        title: "Success",
        description: `${data?.length} subtasks added successfully.`,
      });
    } catch (error) {
      console.error('Error bulk adding subtasks:', error);
      toast({
        title: "Error",
        description: "Failed to add subtasks.",
        variant: "destructive",
      });
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
      // Get authenticated user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create subtasks.",
          variant: "destructive",
        });
        return;
      }

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
          created_by: user.id,
          stage: 1,
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

  const handleSubtaskApprove = async (subtaskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('staff_subtasks')
        .update({
          status: 'completed',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subtaskId)
        .select(`*, staff_profiles:assigned_to(full_name, username)`)
        .single();

      if (error) throw error;

      // Award points for subtask completion
      if (data.points > 0) {
        // 1. Update total_points on staff profile
        const { data: staffProfile } = await supabase
          .from('staff_profiles')
          .select('total_points')
          .eq('user_id', data.assigned_to)
          .single();

        if (staffProfile) {
          await supabase
            .from('staff_profiles')
            .update({
              total_points: (staffProfile.total_points || 0) + data.points,
            })
            .eq('user_id', data.assigned_to);

          // 2. Log to user_points_log (for HR PointsMonitoring)
          await supabase
            .from('user_points_log')
            .insert({
              user_id: data.assigned_to,
              points: data.points,
              reason: `Subtask approved: ${data.title}`,
              category: 'task'
            });

          // 3. Log to user_coin_transactions (for PointsBalance / MyCoins)
          await supabase
            .from('user_coin_transactions')
            .insert({
              user_id: data.assigned_to,
              coins: data.points,
              transaction_type: 'earning',
              description: `Subtask Completed: ${data.title}`,
              source_type: 'subtask',
              source_id: data.id
            });
        }
      }

      setSubtasks(subtasks.map(st => st.id === subtaskId ? data : st));
      toast({ title: "✅ Subtask Approved", description: `The subtask has been approved and ${data.points} points awarded.` });
    } catch (error: any) {
      console.error('Error approving subtask:', error);
      toast({ title: "Error", description: error?.message || "Failed to approve subtask.", variant: "destructive" });
    }
  };

  const handleSubtaskReject = async (subtaskId: string, rejectionNote: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current profile for rejection comment
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Get existing comments and append rejection note
      const { data: subtaskData } = await supabase
        .from('staff_subtasks')
        .select('comments')
        .eq('id', subtaskId)
        .single();

      const existingComments = (subtaskData?.comments as any[]) || [];
      const rejectionComment = {
        user_id: user.id,
        user_name: profile?.full_name || 'Team Head',
        message: `❌ REJECTED: ${rejectionNote || 'Please redo this subtask.'}`,
        timestamp: new Date().toISOString(),
        type: 'rejection'
      };
      const updatedComments = [...existingComments, rejectionComment];

      const { data, error } = await supabase
        .from('staff_subtasks')
        .update({
          status: 'in_progress',
          comments: updatedComments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subtaskId)
        .select(`*, staff_profiles:assigned_to(full_name, username)`)
        .single();

      if (error) throw error;

      setSubtasks(subtasks.map(st => st.id === subtaskId ? data : st));
      toast({ title: "🔄 Subtask Returned", description: "Subtask has been returned to the staff for revision." });
    } catch (error: any) {
      console.error('Error rejecting subtask:', error);
      toast({ title: "Error", description: error?.message || "Failed to return subtask.", variant: "destructive" });
    }
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
      // Get authenticated user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add clients.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: newClient.company_name.trim(),
          contact_person: newClient.contact_person.trim(),
          email: newClient.email.trim().toLowerCase(),
          phone: newClient.phone.trim() || null,
          address: newClient.address.trim() || null,
          notes: newClient.notes.trim() || null,
          created_by: user.id,
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
      setNewTask({ ...newTask, client_id: data.id });

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
    if (!newTask.title || newTask.assigned_to.length === 0 || !newTask.client_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including client selection and at least one assignee.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFiles(true);

      // Get authenticated user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create tasks.",
          variant: "destructive",
        });
        setUploadingFiles(false);
        return;
      }

      const createdTasks = [];
      let finalAttachments = [];
      let firstTaskId = null;

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assigned_to: JSON.stringify(newTask.assigned_to),
        client_id: newTask.client_id,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        trial_period: newTask.trial_period,
        points: newTask.points,
        assigned_by: user.id,
        department_id: userProfile?.department_id || null,
        status: 'pending' as const,
        attachments: []
      };

      const { data: taskResponse, error: taskError } = await supabase
        .from('staff_tasks')
        .insert(taskData)
        .select('*')
        .single();

      if (taskError) throw taskError;

      firstTaskId = taskResponse.id;
      createdTasks.push(taskResponse);

      // Upload files if any
      if (newTask.attachments.length > 0 && firstTaskId) {
        console.log('Uploading attachments:', newTask.attachments.length, 'files');
        for (const attachment of newTask.attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const filePath = `${firstTaskId}/${Date.now()}.${fileExt}`;

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
            finalAttachments.push({
              title: attachment.title || attachment.file.name,
              name: attachment.file.name,
              url: filePath,
              publicUrl: publicUrl,
              size: attachment.file.size,
              type: attachment.file.type
            });
          }
        }

        if (finalAttachments.length > 0) {
          console.log('Updating tasks with attachments:', finalAttachments);
          // Update all tasks with attachment info
          const taskIds = createdTasks.map(t => t.id);
          const { error: updateError } = await supabase
            .from('staff_tasks')
            .update({ attachments: finalAttachments })
            .in('id', taskIds);

          if (updateError) {
            console.error('Error updating tasks with attachments:', updateError);
          }

          // Update local references
          createdTasks.forEach(t => t.attachments = finalAttachments);
        }
      } else {
        console.log('No attachments to upload');
      }

      // Format for the state
      const newTasksForState = createdTasks.map(task => ({
        ...task,
        attachments: task.attachments ? (task.attachments as any) : []
      } as Task));

      setTasks([...newTasksForState, ...tasks]);
      setIsCreateTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: [],
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
        .select('*')
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

  return (
    <div className="px-1 py-4 space-y-8 max-w-7xl mx-auto min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 flex-shrink-0">
            <Settings className="h-5 w-5 text-purple-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight uppercase truncate">
            TEAM HEAD <span className="text-purple-500">WORKSPACE</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {widgetManager}
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Task</span>
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
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="assigned_to">Assign To ({newTask.assigned_to.length} selected)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-xs"
                        onClick={() => {
                          const alreadySelected = newTask.assigned_to.includes(userId);
                          setNewTask({
                            ...newTask,
                            assigned_to: alreadySelected
                              ? newTask.assigned_to
                              : [...newTask.assigned_to, userId]
                          });
                        }}
                      >
                        <User className="h-3 w-3 mr-1" />
                        Assign to myself
                      </Button>
                    </div>
                    <div className="border border-white/20 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1 bg-black/20">
                      {staff.length === 0 ? (
                        <p className="text-xs text-white/50 text-center py-2">No staff members found</p>
                      ) : staff.map(member => {
                        const isChecked = newTask.assigned_to.includes(member.user_id);
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${isChecked ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'
                              }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setNewTask({
                                  ...newTask,
                                  assigned_to: checked
                                    ? [...newTask.assigned_to, member.user_id]
                                    : newTask.assigned_to.filter(id => id !== member.user_id)
                                });
                              }}
                              className="border-white/30"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white truncate">{member.full_name}</div>
                              <div className="text-xs text-white/50 truncate">@{member.username}</div>
                            </div>
                            {isChecked && <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                          </label>
                        );
                      })}
                    </div>
                    {newTask.assigned_to.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {newTask.assigned_to.map(id => {
                          const member = staff.find(s => s.user_id === id);
                          return (
                            <Badge
                              key={id}
                              variant="outline"
                              className="bg-blue-500/20 border-blue-500/30 text-blue-300 text-xs cursor-pointer hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-colors"
                              onClick={() => setNewTask({ ...newTask, assigned_to: newTask.assigned_to.filter(uid => uid !== id) })}
                            >
                              {member?.full_name || 'Unknown'}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
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
                    <Select value={newTask.client_id} onValueChange={(value) => setNewTask({ ...newTask, client_id: value })}>
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
                      <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}>
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
                        onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 10 })}
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
                      onCheckedChange={(checked) => setNewTask({ ...newTask, trial_period: checked })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="due_date">Due Date (Optional)</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="due_time">Due Time (Optional)</Label>
                      <Input
                        id="due_time"
                        type="time"
                        value={newTask.due_time}
                        onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
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
                          const attachmentsWithTitles = files.map((file: any) => ({
                            file,
                            title: file.name.split('.')[0] // Default title is filename without extension
                          }));
                          setNewTask({ ...newTask, attachments: [...newTask.attachments, ...attachmentsWithTitles] });
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
                                    setNewTask({ ...newTask, attachments: newFiles });
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
                                    setNewTask({ ...newTask, attachments: updatedAttachments });
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
      </div>

      <div className="space-y-6">
        {/* Tasks Management */}
        <div className="space-y-6">
          {/* Pending Subtasks for Review */}
          {pendingSubtasks.length > 0 && (
            <Card className="bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-indigo-500/20 backdrop-blur-lg border-purple-500/30 text-white relative z-10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-purple-300" />
                  Subtasks Pending Review ({pendingSubtasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingSubtasks.map((subtask) => {
                    const parentTask = tasks.find((t) => t.id === subtask.task_id);
                    const assigneeProfile = (subtask as any).staff_profiles as any | null;
                    return (
                      <div
                        key={subtask.id}
                        className="bg-black/30 border border-purple-500/40 rounded-lg p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 border border-white/10 bg-white/5 flex-shrink-0">
                            <AvatarImage
                              src={assigneeProfile?.avatar_url || undefined}
                              alt={assigneeProfile?.full_name || subtask.title}
                            />
                            <AvatarFallback className="text-[10px]">
                              {(assigneeProfile?.full_name || "U")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-0.5">
                            <div className="text-sm font-semibold text-white truncate">
                              {subtask.title}
                            </div>
                            {parentTask && (
                              <div className="text-[11px] text-white/60 truncate">
                                In task: <span className="font-medium">{parentTask.title}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-white/50 flex flex-wrap gap-x-2 gap-y-0.5">
                              {assigneeProfile && (
                                <span>
                                  👤 {assigneeProfile.full_name} (@{assigneeProfile.username})
                                </span>
                              )}
                              {subtask.points > 0 && <span>⭐ {subtask.points} pts</span>}
                              {subtask.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {(() => {
                                    try {
                                      const d = new Date(subtask.due_date as any);
                                      return isNaN(d.getTime()) ? "Invalid date" : format(d, "MMM dd");
                                    } catch {
                                      return "Invalid date";
                                    }
                                  })()}
                                  {subtask.due_time && ` ${subtask.due_time}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {parentTask && (
                          <Button
                            size="sm"
                            className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white h-8 text-xs"
                            onClick={async () => {
                              setSelectedTask(parentTask);
                              await fetchSubtasks(parentTask.id);
                              setIsViewTaskOpen(true);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Approval Tasks */}
          {tasks.filter(t => t.status === 'pending_approval').length > 0 && (
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg border-orange-500/30 text-white relative z-10">
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
                              {getAssigneeName(task.assigned_to)}
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

          <Card className="bg-black/20 backdrop-blur-lg border-white/10 text-white overflow-hidden relative z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-purple-400" />
                Team Tasks
              </CardTitle>
              <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${viewMode === 'card' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                  onClick={() => setViewMode('card')}
                  title="Card View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] sm:h-[600px] w-full">
                {viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-white/80 w-[30%]">Task</TableHead>
                          <TableHead className="text-white/80 w-[20%]">Assigned To</TableHead>
                          <TableHead className="text-white/80 w-[15%]">Status</TableHead>
                          <TableHead className="text-white/80 w-[15%]">Priority</TableHead>
                          <TableHead className="text-white/80 text-right w-[20%]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="align-top">
                              <div>
                                <div className="font-medium text-white text-sm sm:text-base">{task.title}</div>
                                {task.description && (
                                  <div className="text-xs sm:text-sm text-white/60 truncate max-w-[200px] sm:max-w-xs">
                                    {task.description}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {task.trial_period && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                                      Trial
                                    </Badge>
                                  )}
                                  {(task.due_date || task.due_time) && (
                                    <div className="text-[10px] sm:text-xs text-white/50 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {task.due_date && task.due_date.trim() !== '' && (() => {
                                        try {
                                          const date = new Date(task.due_date);
                                          if (isNaN(date.getTime())) return 'Invalid date';
                                          return format(date, 'MMM dd');
                                        } catch {
                                          return 'Invalid date';
                                        }
                                      })()}
                                      {task.due_time && ` ${task.due_time}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-white/10 bg-white/5">
                              <AvatarImage
                                src={
                                  getAssigneeProfiles(task.assigned_to)[0]?.avatar_url || undefined
                                }
                                alt={getAssigneeName(task.assigned_to)}
                              />
                              <AvatarFallback className="text-[10px]">
                                {getAssigneeName(task.assigned_to)
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-white/90 text-sm truncate">
                                {getAssigneeName(task.assigned_to)}
                              </div>
                              <div className="text-[11px] text-white/50 truncate">
                                @{getAssigneeUsername(task.assigned_to)} • {getAssigneeCount(task.assigned_to)}{" "}
                                assignee{getAssigneeCount(task.assigned_to) === 1 ? "" : "s"}
                              </div>
                              <div className="text-[10px] text-white/40 truncate">
                                Created by {getCreatorName(task.assigned_by)}
                              </div>
                            </div>
                          </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="scale-90 origin-left">
                                {getStatusBadge(task.status)}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="scale-90 origin-left">
                                {getPriorityBadge(task.priority)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <div className="flex gap-1 justify-end flex-wrap sm:flex-nowrap">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => handleTaskStatusUpdate(task.id, value)}
                                >
                                  <SelectTrigger className="w-24 sm:w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="handover">Handover</SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="flex gap-0.5">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={async () => {
                                      setSelectedTask(task);
                                      await fetchSubtasks(task.id);
                                      setIsViewTaskOpen(true);
                                    }}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setIsEditTaskOpen(true);
                                    }}
                                    title="Edit task"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>

                                  {/* Only show delete button for tasks created by this team head */}
                                  {task.assigned_by === userId && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      title="Delete task"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                    {tasks.map((task) => (
                      <div key={task.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 flex flex-col h-full hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-white text-base truncate" title={task.title}>{task.title}</h4>
                            {task.description && (
                              <p className="text-white/60 text-sm line-clamp-2 mt-1" title={task.description}>
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm flex-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-white/10 bg-white/5">
                              <AvatarImage
                                src={
                                  getAssigneeProfiles(task.assigned_to)[0]?.avatar_url || undefined
                                }
                                alt={getAssigneeName(task.assigned_to)}
                              />
                              <AvatarFallback className="text-[10px]">
                                {getAssigneeName(task.assigned_to)
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-white/90 truncate">
                                {getAssigneeName(task.assigned_to)}
                              </div>
                              <div className="text-[11px] text-white/50 truncate">
                                @{getAssigneeUsername(task.assigned_to)} • {getAssigneeCount(task.assigned_to)}{" "}
                                assignee{getAssigneeCount(task.assigned_to) === 1 ? "" : "s"}
                              </div>
                              <div className="text-[10px] text-white/40 truncate">
                                Created by {getCreatorName(task.assigned_by)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-white/70 border-white/20 w-fit">
                              {task.points} pts
                            </Badge>
                            {task.trial_period && (
                              <Badge variant="outline" className="text-[10px] bg-yellow-500/20 border-yellow-500/30 text-yellow-300 w-fit">
                                Trial
                              </Badge>
                            )}
                          </div>

                          {(task.due_date || task.due_time) && (
                            <div className="flex items-center gap-2 col-span-2 text-white/50 pt-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {task.due_date && task.due_date.trim() !== '' && (() => {
                                  try {
                                    const date = new Date(task.due_date);
                                    if (isNaN(date.getTime())) return 'Invalid date';
                                    return format(date, 'MMM dd');
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                                {task.due_time && ` ${task.due_time}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-white/10 mt-auto">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white/60">Status:</span>
                            {getStatusBadge(task.status)}
                          </div>

                          <Select
                            value={task.status}
                            onValueChange={(value) => handleTaskStatusUpdate(task.id, value)}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="handover">Handover</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 text-xs"
                              onClick={async () => {
                                setSelectedTask(task);
                                await fetchSubtasks(task.id);
                                setIsViewTaskOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              View
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 text-xs"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsEditTaskOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>

                            {task.assigned_by === userId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-8 text-xs"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
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
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={selectedTask.description}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_assigned_to">Reassign To</Label>
                <Select
                  value={selectedTask.assigned_to}
                  onValueChange={(value) => setSelectedTask({ ...selectedTask, assigned_to: value })}
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
                    onValueChange={(value) => setSelectedTask({ ...selectedTask, priority: value as any })}
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
                    onChange={(e) => setSelectedTask({ ...selectedTask, points: parseInt(e.target.value) || 10 })}
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
                  onCheckedChange={(checked) => setSelectedTask({ ...selectedTask, trial_period: checked })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_due_date">Due Date</Label>
                  <Input
                    id="edit_due_date"
                    type="date"
                    value={selectedTask.due_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_due_time">Due Time</Label>
                  <Input
                    id="edit_due_time"
                    type="time"
                    value={selectedTask.due_time || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_time: e.target.value })}
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
                onValueChange={(value) => setHandoverData({ ...handoverData, target_department: value })}
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
                onChange={(e) => setHandoverData({ ...handoverData, notes: e.target.value })}
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
                        <span className="font-medium">{getAssigneeName(selectedTask.assigned_to)}</span>
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

                {/* Template Selection Section */}
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-sm flex items-center gap-2 text-white">
                        <LayoutTemplate className="h-4 w-4 text-purple-400" />
                        Task Templates (Bulk)
                      </h5>
                      <p className="text-[10px] text-white/50">Select a preset to add multiple subtasks at once.</p>
                    </div>
                    {bulkSubtasks.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        onClick={() => {
                          setBulkSubtasks([]);
                          setSelectedTaskTemplateId("none");
                        }}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>

                  {!selectedTaskTemplateId || selectedTaskTemplateId === 'none' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {taskTemplates.map((tpl: any) => (
                        <div
                          key={tpl.id}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 cursor-pointer transition-all group hover:border-purple-500/50"
                          onClick={() => {
                            setSelectedTaskTemplateId(tpl.id);
                            if (tpl.subtask_templates) {
                              setBulkSubtasks(tpl.subtask_templates.map((st: any) => ({
                                ...st,
                                assigned_to: "",
                                priority: tpl.priority || 'medium'
                              })));
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate group-hover:text-purple-400 transition-colors text-white">{tpl.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 border-white/10 text-white/50">
                                  {tpl.subtask_templates?.length || 0} tasks
                                </Badge>
                                <span className="text-[9px] text-white/40">{tpl.points} pts</span>
                              </div>
                            </div>
                            <Plus className="h-3 w-3 text-white/30 group-hover:text-purple-400 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h6 className="text-[11px] font-bold text-purple-400">
                            Template: {taskTemplates.find(t => t.id === selectedTaskTemplateId)?.title}
                          </h6>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded border border-white/10">
                          <span className="text-[9px] text-white/60 px-1">Assign All To:</span>
                          <Select onValueChange={(val) => {
                            setBulkSubtasks(bulkSubtasks.map(st => ({ ...st, assigned_to: val })));
                          }}>
                            <SelectTrigger className="w-[110px] h-6 text-[9px] border-none bg-transparent focus:ring-0 shadow-none text-white">
                              <SelectValue placeholder="Select staff" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map((member: any) => (
                                <SelectItem key={member.id} value={member.user_id} className="text-xs">{member.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="bg-black/20 rounded-md border border-white/10 p-2 max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
                        {bulkSubtasks.map((st, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex-1 min-w-0 ml-1">
                              <p className="text-[10px] font-medium truncate text-white/90">{st.title}</p>
                              <p className="text-[8px] text-white/40">{st.points} pts</p>
                            </div>
                            <Select
                              value={st.assigned_to}
                              onValueChange={(val) => {
                                const newBulk = [...bulkSubtasks];
                                newBulk[idx].assigned_to = val;
                                setBulkSubtasks(newBulk);
                              }}
                            >
                              <SelectTrigger className="w-[130px] h-7 text-[10px] bg-black/40 border-white/10 text-white">
                                <SelectValue placeholder="Assign To..." />
                              </SelectTrigger>
                              <SelectContent>
                                {staff.map((member: any) => (
                                  <SelectItem key={member.id} value={member.user_id} className="text-xs">
                                    {member.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[10px] text-white/60 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => {
                            setBulkSubtasks([]);
                            setSelectedTaskTemplateId("none");
                          }}
                        >
                          Change Template
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-[10px] bg-purple-600 hover:bg-purple-700 font-semibold text-white"
                          onClick={handleBulkAddSubtasks}
                        >
                          Add {bulkSubtasks.length} Subtasks
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/10 my-2 pt-4">
                    <h5 className="font-medium text-[11px] text-white/40 uppercase tracking-widest mb-3">Create Individual Subtask</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                      <div className="md:col-span-2 mb-2">
                        <Select
                          value={selectedSubtaskTemplateId}
                          onValueChange={(value) => {
                            setSelectedSubtaskTemplateId(value);
                            if (value !== 'none') {
                              const tpl = subtaskTemplates.find(t => t.id === value);
                              if (tpl) {
                                setNewSubtask(prev => ({
                                  ...prev,
                                  title: tpl.title || "",
                                  description: tpl.description || "",
                                  points: tpl.points || 0
                                }));
                              }
                            } else {
                              setNewSubtask(prev => ({
                                ...prev,
                                title: "",
                                description: "",
                                points: 0
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Quick fill from subtask template..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Manual / Custom Entry</SelectItem>
                            {subtaskTemplates.map((tpl: any) => (
                              <SelectItem key={tpl.id} value={tpl.id}>{tpl.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Subtask title *"
                          value={newSubtask.title}
                          onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                          className="h-9 text-xs bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Textarea
                          placeholder="Description (optional)"
                          value={newSubtask.description}
                          onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                          rows={2}
                          className="text-xs resize-none bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:col-span-2">
                        <Select
                          value={newSubtask.assigned_to}
                          onValueChange={(value) => setNewSubtask({ ...newSubtask, assigned_to: value })}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Assign To *" />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.map((member: any) => (
                              <SelectItem key={member.id} value={member.user_id} className="text-xs">
                                {member.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={newSubtask.priority}
                          onValueChange={(value) => setNewSubtask({ ...newSubtask, priority: value as any })}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low" className="text-xs text-blue-400">Low</SelectItem>
                            <SelectItem value="medium" className="text-xs text-yellow-400">Medium</SelectItem>
                            <SelectItem value="high" className="text-xs text-orange-400">High</SelectItem>
                            <SelectItem value="urgent" className="text-xs text-red-500 font-bold">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:col-span-2">
                        <Input
                          type="number"
                          placeholder="Points"
                          value={newSubtask.points === 0 ? "" : newSubtask.points}
                          onChange={(e) => setNewSubtask({ ...newSubtask, points: parseInt(e.target.value) || 0 })}
                          min="0"
                          className="h-9 text-xs bg-white/5 border-white/10 text-white"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="date"
                            value={newSubtask.due_date}
                            onChange={(e) => setNewSubtask({ ...newSubtask, due_date: e.target.value })}
                            className="h-9 text-xs bg-white/5 border-white/10 text-white flex-1"
                          />
                          <Input
                            type="time"
                            value={newSubtask.due_time}
                            onChange={(e) => setNewSubtask({ ...newSubtask, due_time: e.target.value })}
                            className="h-9 text-xs bg-white/5 border-white/10 text-white w-24"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCreateSubtask(selectedTask.id)}
                        className="md:col-span-2 h-9 text-xs bg-primary hover:bg-primary/90 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Individual Subtask
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subtasks List */}
                {loadingSubtasks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                ) : subtasks.length > 0 ? (
                  <div className="space-y-3">
                    {subtasks.map((subtask, idx) => {
                      const isPendingApproval = subtask.status === 'pending_approval';
                      const isCompleted = subtask.status === 'completed';
                      const isInProgress = subtask.status === 'in_progress';

                      const submissionComments = Array.isArray(subtask.comments)
                        ? subtask.comments.filter((c: any) => c.type === 'submission_note' || c.type === 'rejection')
                        : [];
                      const submissionAttachments = Array.isArray(subtask.attachments) ? subtask.attachments : [];

                      return (
                        <div
                          key={subtask.id}
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${isPendingApproval
                            ? 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-900/20'
                            : isCompleted
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-white/10 bg-white/3'
                            }`}
                        >
                          {/* Subtask Header */}
                          <div className="p-3 flex items-center gap-3">
                            {/* Step Number / Status Icon */}
                            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${isCompleted ? 'bg-green-500 text-white' :
                              isPendingApproval ? 'bg-orange-500 text-white animate-pulse' :
                                isInProgress ? 'bg-blue-500 text-white' :
                                  'bg-white/10 text-white/40'
                              }`}>
                              {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-white/40' : 'text-white'}`}>
                                  {subtask.title}
                                </span>
                                {getPriorityBadge(subtask.priority)}
                                {isPendingApproval && (
                                  <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded px-1.5 py-0.5 animate-pulse">
                                    AWAITING REVIEW
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">
                                    ✓ APPROVED
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-white/40">
                                <span>👤 {subtask.staff_profiles?.full_name || 'Unassigned'}</span>
                                {subtask.points > 0 && <span>⭐ {subtask.points} pts</span>}
                                {subtask.due_date && subtask.due_date.trim() !== '' && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {(() => {
                                      try {
                                        const d = new Date(subtask.due_date);
                                        return isNaN(d.getTime()) ? 'Invalid date' : format(d, 'MMM dd, yyyy');
                                      } catch { return 'Invalid date'; }
                                    })()}
                                    {subtask.due_time && ` at ${subtask.due_time}`}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions for non-pending-approval statuses */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!isPendingApproval && (
                                <Select
                                  value={subtask.status}
                                  onValueChange={(value) => handleSubtaskStatusUpdate(subtask.id, value)}
                                >
                                  <SelectTrigger className="w-28 h-7 text-[10px] bg-black/30 border-white/10 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                    <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                                    <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                className="h-7 w-7 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                                title="Delete subtask"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Pending Approval Panel — rich review UI */}
                          {isPendingApproval && (
                            <div className="border-t border-orange-500/20 bg-black/30 px-4 pb-4 pt-3 space-y-4">
                              <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Staff Submission — Awaiting Your Review
                              </p>

                              {/* Submission Notes */}
                              {submissionComments.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Notes from Staff</p>
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                    {submissionComments.map((comment: any, cidx: number) => (
                                      <div
                                        key={cidx}
                                        className={`p-2 rounded-lg text-xs ${comment.type === 'rejection'
                                          ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                          : 'bg-white/5 border border-white/5 text-white/80'
                                          }`}
                                      >
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="font-semibold text-[10px] text-white/60">{comment.user_name}</span>
                                          <span className="text-[9px] text-white/30">{new Date(comment.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p>{comment.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Submitted Attachments */}
                              {submissionAttachments.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Proof of Work</p>
                                  <div className="flex flex-wrap gap-2">
                                    {submissionAttachments.map((att: any, aidx: number) => (
                                      <a
                                        key={aidx}
                                        href={att.publicUrl || att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] hover:bg-blue-500/20 transition-colors"
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        <span className="max-w-[100px] truncate">{att.name || 'Attachment'}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Rejection Note Input */}
                              <div className="space-y-1">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">Rejection Reason (if returning)</p>
                                <Textarea
                                  placeholder="Optional: explain what needs to be fixed..."
                                  value={rejectionNotes[subtask.id] || ''}
                                  onChange={(e) => setRejectionNotes({ ...rejectionNotes, [subtask.id]: e.target.value })}
                                  rows={2}
                                  className="text-xs resize-none bg-black/40 border-white/10 text-white placeholder:text-white/20"
                                />
                              </div>

                              {/* Approve / Return Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 h-9 bg-green-600 hover:bg-green-700 font-bold text-xs gap-2"
                                  onClick={() => handleSubtaskApprove(subtask.id)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  APPROVE
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-9 border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs gap-2"
                                  onClick={() => {
                                    handleSubtaskReject(subtask.id, rejectionNotes[subtask.id] || '');
                                    setRejectionNotes({ ...rejectionNotes, [subtask.id]: '' });
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  RETURN
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Completed subtask — show approval details */}
                          {isCompleted && subtask.approved_at && (
                            <div className="border-t border-green-500/10 bg-green-500/3 px-3 py-1.5">
                              <p className="text-[9px] text-green-500/60">
                                Approved {new Date(subtask.approved_at).toLocaleString()}
                              </p>
                            </div>
                          )}

                          {/* Normal comment thread for non-review statuses */}
                          {!isPendingApproval && (
                            <div className="border-t border-white/5 px-3 pb-3 pt-2">
                              {/* Display existing comments (including rejections shown to head) */}
                              {subtask.comments && subtask.comments.length > 0 && (
                                <div className="space-y-1 mb-2 max-h-24 overflow-y-auto custom-scrollbar">
                                  {(subtask.comments as any[]).map((comment: any, idx: number) => (
                                    <div key={idx} className={`text-xs p-1.5 rounded ${comment.type === 'rejection' ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-white/70'}`}>
                                      <span className="font-semibold text-white/50 mr-1">{comment.user_name}:</span>
                                      {comment.message}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 mt-1">
                                <Textarea
                                  placeholder="Add a note..."
                                  value={newMessageSubtask[subtask.id] || ''}
                                  onChange={(e) => setNewMessageSubtask({ ...newMessageSubtask, [subtask.id]: e.target.value })}
                                  className="flex-1 text-xs resize-none bg-black/30 border-white/10 text-white"
                                  rows={1}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 self-end"
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
                                  className="h-8 w-8 self-end"
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
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
                onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                placeholder="Enter company name"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                value={newClient.contact_person}
                onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
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
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
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
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                placeholder="Enter phone number"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
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
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
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

      {/* Client Onboarding Section */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardContent className="pt-4">
          <ClientOnboardingCreator userId={userId} />
        </CardContent>
      </Card>

      <TaskApprovalDialog
        task={selectedTask}
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        onApproved={() => {
          fetchTasks();
          setSelectedTask(null);
        }}
      />
    </div >
  );
};

export default TeamHeadWorkspace;