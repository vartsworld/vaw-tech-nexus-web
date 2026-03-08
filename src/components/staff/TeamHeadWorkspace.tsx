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
import SharedProjectForm from "../projects/SharedProjectForm";
import TaskCreatePage from "../hr/TaskCreatePage";
import TaskDetailPage from "../hr/TaskDetailPage";
import { SubtaskReviewDialog } from "./SubtaskReviewDialog";

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
  client_id?: string;
  client_project_id?: string;
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
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'detail'>('list');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    project_type: "website" as "website" | "marketing" | "design" | "ai" | "vr-ar" | "other",
    package_type: "basic",
    addons: ""
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingSubtaskAttachment, setUploadingSubtaskAttachment] = useState<string | null>(null);
  const [newMessageTask, setNewMessageTask] = useState("");
  const [newMessageSubtask, setNewMessageSubtask] = useState<{ [key: string]: string }>({});
  const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});
  const [reviewDialogSubtask, setReviewDialogSubtask] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Subtask[]>([]);
  const [approvedSubtasks, setApprovedSubtasks] = useState<Subtask[]>([]);
  const [returnedSubtasks, setReturnedSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    points: 0,
    due_date: "",
    due_time: "",
    stage: 1
  });
  const [quickAddStage, setQuickAddStage] = useState<number | null>(null);
  const [pricingPackages, setPricingPackages] = useState<{ name: string; slug: string }[]>([]);
  const [availableAddons, setAvailableAddons] = useState<{ name: string; price: number }[]>([]);
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
    client_project_id: "",
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

  const getAssigneeName = (assignedTo: string | undefined | null): string => {
    if (!assignedTo) return "Unassigned";
    const assignees = getAssigneeProfiles(assignedTo);
    if (assignees.length === 0) return "Unassigned";
    if (assignees.length === 1) return assignees[0]?.full_name || "Unknown";
    const [first, ...rest] = assignees;
    return `${first?.full_name || "Unknown"} + ${rest.length} more`;
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

  // Fetch subtask review queues for this head:
  // - pendingSubtasks: pending_approval in this department
  // - approvedSubtasks: completed & approved_by = current user
  // - returnedSubtasks: in_progress with latest rejection comment from current user
  const fetchReviewQueues = async () => {
    if (!userProfile?.department_id && !userId) {
      setPendingSubtasks([]);
      setApprovedSubtasks([]);
      setReturnedSubtasks([]);
      return;
    }
    try {
      // Fetch pending_approval subtasks - filter for tasks in head's department OR assigned_by this head
      const { data: pending, error: pendingError } = await supabase
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
        .eq("status", "pending_approval" as any);

      if (pendingError) throw pendingError;
      
      // Filter: tasks in head's department OR tasks assigned_by this head
      const filteredPending = (pending || []).filter((st: any) => {
        const task = st.staff_tasks;
        if (!task) return false;
        return task.department_id === userProfile?.department_id || task.assigned_by === userId;
      });
      setPendingSubtasks(filteredPending as any);

      // Approved by this head
      const { data: approved, error: approvedError } = await supabase
        .from("staff_subtasks")
        .select(
          `
          *,
          staff_tasks!inner (
            id,
            title,
            department_id,
            assigned_by
          ),
          staff_profiles:assigned_to (
            full_name,
            username,
            avatar_url,
            role
          )
        `
        )
        .eq("status", "completed" as any)
        .eq("approved_by", userId as any)
        .order("approved_at", { ascending: false } as any)
        .limit(15);

      if (approvedError) throw approvedError;
      const filteredApproved = (approved || []).filter((st: any) => {
        const task = st.staff_tasks;
        if (!task) return false;
        return task.department_id === userProfile?.department_id || task.assigned_by === userId;
      });
      setApprovedSubtasks(filteredApproved as any);

      // Returned for rework by this head (status back to in_progress and has rejection comment by this user)
      const { data: returnedRaw, error: returnedError } = await supabase
        .from("staff_subtasks")
        .select(
          `
          *,
          staff_tasks!inner (
            id,
            title,
            department_id,
            assigned_by
          ),
          staff_profiles:assigned_to (
            full_name,
            username,
            avatar_url,
            role
          )
        `
        )
        .eq("status", "in_progress" as any);

      if (returnedError) throw returnedError;

      const returnedFiltered = (returnedRaw || []).filter((st: any) => {
        const task = st.staff_tasks;
        if (!task) return false;
        const inScope = task.department_id === userProfile?.department_id || task.assigned_by === userId;
        if (!inScope) return false;
        if (!Array.isArray(st.comments)) return false;
        const lastRejection = [...st.comments].reverse().find(c => c.type === "rejection");
        return lastRejection && lastRejection.user_id === userId;
      });

      setReturnedSubtasks(returnedFiltered as any);
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
    fetchPricingData();
  }, [userId, userProfile?.department_id]);

  const fetchPricingData = async () => {
    try {
      const pkgRes = await supabase.from('pricing_packages').select('name, slug').eq('is_enabled', true).order('sort_order');
      if (pkgRes.data && pkgRes.data.length > 0) {
        setPricingPackages([...pkgRes.data, { name: 'Custom Package', slug: 'custom' }]);
      }

      const addonRes = await supabase.from('pricing_addons').select('name, price').eq('is_enabled', true).order('sort_order');
      if (addonRes.data) {
        setAvailableAddons(addonRes.data);
      }
    } catch (err) {
      console.error('Error fetching pricing data:', err);
    }
  };

  // Fetch staff only when userProfile is loaded
  useEffect(() => {
    if (userProfile?.department_id) {
      fetchStaff();
    }
  }, [userId, userProfile?.department_id]);

  // Fetch client projects when editing a task
  useEffect(() => {
    if (isEditTaskOpen && selectedTask?.client_id) {
      fetchClientProjects(selectedTask.client_id);
    }
  }, [isEditTaskOpen, selectedTask?.client_id]);

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

      // Enrich each task with subtask stage summary (lightweight parallel fetch)
      const enrichedTasks = await Promise.all(
        tasksWithAttachments.map(async (task) => {
          try {
            const { data: subs } = await supabase
              .from('staff_subtasks')
              .select('stage, status, title')
              .eq('task_id', task.id);
            if (!subs || subs.length === 0) return { ...task, _stageInfo: null };

            const stageMap: Record<number, { total: number; completed: number; titles: string[] }> = {};
            subs.forEach((s: any) => {
              const stg = s.stage || 1;
              if (!stageMap[stg]) stageMap[stg] = { total: 0, completed: 0, titles: [] };
              stageMap[stg].total++;
              stageMap[stg].titles.push(s.title);
              if (s.status === 'completed') stageMap[stg].completed++;
            });

            const stageNums = Object.keys(stageMap).map(Number).sort((a, b) => a - b);
            const totalStages = stageNums.length;
            const completedStages = stageNums.filter(s => stageMap[s].completed === stageMap[s].total).length;
            // Current stage = first stage with incomplete subtasks, or last+1 if all done
            const currentStage = task.current_stage || stageNums.find(s => stageMap[s].completed < stageMap[s].total) || (stageNums[stageNums.length - 1] + 1);
            // Stage title = first subtask title in the current stage
            const currentStageTitles = stageMap[currentStage]?.titles || [];
            const stageTitle = currentStageTitles.length > 0 ? currentStageTitles[0] : null;

            return {
              ...task,
              current_stage: currentStage,
              _stageInfo: {
                totalStages,
                completedStages,
                stageTitle,
                stageNums,
                stageMap
              }
            };
          } catch {
            return { ...task, _stageInfo: null };
          }
        })
      );

      setTasks(enrichedTasks as Task[]);

      // Also fetch subtask review queues for this head
      await fetchReviewQueues();
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

  const fetchClientProjects = async (clientId: string) => {
    if (!clientId) {
      setClientProjects([]);
      return;
    }
    try {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('client_projects')
        .select('id, title')
        .eq('client_id', clientId)
        .order('title');

      if (error) throw error;
      setClientProjects(data || []);
    } catch (error) {
      console.error('Error fetching client projects:', error);
    } finally {
      setLoadingProjects(false);
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

  const handleProjectSuccess = async (project: any) => {
    setIsAddProjectDialogOpen(false);
    if (newTask.client_id) {
      await fetchClientProjects(newTask.client_id);
    }
    setNewTask({ ...newTask, client_project_id: project.id });
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
        .insert(subtasksToInsert as any)
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
        description: error instanceof Error ? error.message : "Failed to add subtasks.",
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
          stage: newSubtask.stage || 1,
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
        due_time: "",
        stage: newSubtask.stage
      });
      setQuickAddStage(null);

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
              reason: `Subtask Completed: ${data.title}`,
              source_type: 'subtask',
            } as any);
        }
      }

      const updatedSubtasks = subtasks.map(st => st.id === subtaskId ? data : st);
      setSubtasks(updatedSubtasks);

      // --- Auto-advance current_stage on parent task ---
      try {
        const approvedStage = (data as any).stage || 1;
        const taskId = data.task_id;
        // Check: are ALL subtasks in this stage now completed?
        const stageSubtasks = updatedSubtasks.filter((st: any) => (st.stage || 1) === approvedStage);
        const allStageComplete = stageSubtasks.length > 0 && stageSubtasks.every((st: any) => st.status === 'completed');

        if (allStageComplete && taskId) {
          // Find the next stage that still has non-completed subtasks
          const allStages = [...new Set(updatedSubtasks.map((st: any) => (st.stage || 1) as number))].sort((a, b) => a - b);
          const nextIncompleteStage = allStages.find(s => {
            const subs = updatedSubtasks.filter((st: any) => (st.stage || 1) === s);
            return subs.some((st: any) => st.status !== 'completed');
          });
          // If no incomplete stage, use the max stage + 1 (all done)
          const newCurrentStage = nextIncompleteStage ?? ((allStages[allStages.length - 1] || 1) + 1);

          await supabase
            .from('staff_tasks')
            .update({ current_stage: newCurrentStage, updated_at: new Date().toISOString() } as any)
            .eq('id', taskId);

          // Update local tasks state
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, current_stage: newCurrentStage } : t));
        }
      } catch (stageErr) {
        console.error('Error advancing stage:', stageErr);
      }

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
      await fetchClientProjects(data.id);

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
        client_project_id: (newTask.client_project_id && newTask.client_project_id !== 'none') ? newTask.client_project_id : null,
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
      setCurrentView('list');
      setNewTask({
        title: "",
        description: "",
        assigned_to: [],
        client_id: "",
        client_project_id: "",
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
          client_id: selectedTask.client_id,
          client_project_id: (selectedTask.client_project_id && selectedTask.client_project_id !== 'none') ? selectedTask.client_project_id : null,
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

      // --- Sync: task status → client project status ---
      if (finalStatus === 'in_progress' && data.client_project_id) {
        await supabase.from('client_projects')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', data.client_project_id)
          .eq('status', 'pending');
      }

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

  const getStatusBadge = (status: string | undefined | null) => {
    const safeStatus = status || 'pending';
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Target },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      handover: { color: 'bg-purple-100 text-purple-800', icon: ArrowRight },
      pending_approval: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const config = statusConfig[safeStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {safeStatus.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | undefined | null) => {
    const safePriority = priority || 'medium';
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={priorityConfig[safePriority] || priorityConfig.medium}>
        <Flag className="h-3 w-3 mr-1" />
        {safePriority.toUpperCase()}
      </Badge>
    );
  };

  // Full-page Create Task view
  if (currentView === 'create') {
    return (
      <TaskCreatePage
        onBack={() => setCurrentView('list')}
        onCreated={() => {
          setCurrentView('list');
          fetchTasks();
        }}
        userProfile={userProfile}
      />
    );
  }

  // Full-page Task Detail view
  if (currentView === 'detail' && selectedTask) {
    return (
      <TaskDetailPage
        task={selectedTask}
        onBack={() => { setCurrentView('list'); setSelectedTask(null); }}
        onStatusUpdate={(taskId, status) => {
          handleTaskStatusUpdate(taskId, status);
        }}
        onEdit={(task) => {
          setSelectedTask(task);
          setIsEditTaskOpen(true);
          setCurrentView('list');
        }}
        onDelete={(task) => {
          setSelectedTask(task);
          setIsDeleteDialogOpen(true);
          setCurrentView('list');
        }}
        userProfile={userProfile}
        staff={staff}
        subtaskTemplates={subtaskTemplates}
        taskTemplates={taskTemplates}
      />
    );
  }

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
          {/* Review Requests - Quick Action */}
          {pendingSubtasks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 relative animate-pulse"
              onClick={() => {
                if (pendingSubtasks.length > 0) {
                  const first = pendingSubtasks[0];
                  setReviewDialogSubtask(first);
                  setReviewDialogOpen(true);
                }
              }}
            >
              <ListChecks className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Review</span>
              <Badge className="ml-1.5 h-5 min-w-[20px] px-1 bg-purple-500 text-white text-[10px] font-bold border-0 animate-none">
                {pendingSubtasks.length}
              </Badge>
            </Button>
          )}
          {/* Recently Approved - Quick Action Dialog */}
          {approvedSubtasks.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 relative"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Approved</span>
                  <Badge className="ml-1.5 h-5 min-w-[20px] px-1 bg-emerald-500 text-white text-[10px] font-bold border-0">
                    {approvedSubtasks.length}
                  </Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-gray-900/95 backdrop-blur-xl border-emerald-500/30 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="h-5 w-5" />
                    Recently Approved Subtasks ({approvedSubtasks.length})
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-2">
                  <div className="space-y-3">
                    {approvedSubtasks.map((subtask: any) => {
                      const parentTaskPartial = subtask.staff_tasks as any;
                      const parentTask = tasks.find((t) => t.id === parentTaskPartial?.id) || parentTaskPartial;
                      const assigneeProfile = subtask.staff_profiles as any | null;
                      return (
                        <div
                          key={subtask.id}
                          className="bg-black/30 border border-emerald-500/40 rounded-lg p-3 flex items-center justify-between gap-3"
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
                                {subtask.approved_at && (
                                  <span>
                                    ✅ {new Date(subtask.approved_at).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {parentTask && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-shrink-0 h-8 text-xs border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/20"
                              onClick={async () => {
                                try {
                                  setSelectedTask(parentTask);
                                  await fetchSubtasks(parentTask.id);
                                  setCurrentView('detail');
                                } catch (e) { console.error('Error opening task view:', e); }
                              }}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
          {widgetManager}
          <Button className="flex items-center gap-2" onClick={() => setCurrentView('create')}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Task</span>
          </Button>
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
                        className="bg-black/30 border border-purple-500/40 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-purple-500/15 hover:border-purple-400/50 transition-all duration-200 group"
                        onClick={() => {
                          setReviewDialogSubtask(subtask);
                          setReviewDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 border border-white/10 bg-white/5 flex-shrink-0 group-hover:border-purple-400/50 transition-colors">
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
                            <div className="text-sm font-semibold text-white truncate group-hover:text-purple-200 transition-colors">
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
                                  👤 {assigneeProfile.full_name}
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
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-[9px] bg-purple-500/15 border-purple-500/30 text-purple-300">
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}




          {/* Subtasks Returned for Rework */}
          {returnedSubtasks.length > 0 && (
            <Card className="bg-gradient-to-br from-red-500/20 via-rose-500/10 to-orange-500/20 backdrop-blur-lg border-red-500/30 text-white relative z-10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-300" />
                  Returned for Rework ({returnedSubtasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {returnedSubtasks.map((subtask: any) => {
                    const parentTaskPartial = subtask.staff_tasks as any;
                    const parentTask = tasks.find((t) => t.id === parentTaskPartial?.id) || parentTaskPartial;
                    const assigneeProfile = subtask.staff_profiles as any | null;
                    const lastRejection = Array.isArray(subtask.comments)
                      ? [...subtask.comments].reverse().find((c: any) => c.type === "rejection")
                      : null;
                    return (
                      <div
                        key={subtask.id}
                        className="bg-black/30 border border-red-500/40 rounded-lg p-3 flex items-center justify-between gap-3"
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
                            {lastRejection && (
                              <div className="text-[11px] text-red-200/90 line-clamp-2">
                                {lastRejection.message}
                              </div>
                            )}
                          </div>
                        </div>
                        {parentTask && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0 h-8 text-xs border-red-400/50 text-red-200 hover:bg-red-500/20"
                            onClick={async () => {
                              try {
                                setSelectedTask(parentTask);
                                await fetchSubtasks(parentTask.id);
                                setCurrentView('detail');
                              } catch (e) { console.error('Error opening task view:', e); }
                            }}
                          >
                            View
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
                          <TableHead className="text-white/80 w-[28%]">Task</TableHead>
                          <TableHead className="text-white/80 w-[18%]">Assigned To</TableHead>
                          <TableHead className="text-white/80 w-[14%]">Stage</TableHead>
                          <TableHead className="text-white/80 w-[12%]">Status</TableHead>
                          <TableHead className="text-white/80 w-[10%]">Priority</TableHead>
                          <TableHead className="text-white/80 text-right w-[18%]">Actions</TableHead>
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
                              {(() => {
                                const stageInfo = (task as any)._stageInfo;
                                const currentStage = (task as any).current_stage;
                                if (!stageInfo) {
                                  return (
                                    <span className="text-[10px] text-white/30 italic">No subtasks</span>
                                  );
                                }
                                const { totalStages, completedStages, stageTitle, stageMap } = stageInfo;
                                const allDone = completedStages >= totalStages;
                                const progressPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
                                return (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      {allDone ? (
                                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] px-1.5 py-0">
                                          ✅ All Done
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-1.5 py-0">
                                          Stage {currentStage}
                                        </Badge>
                                      )}
                                    </div>
                                    {stageTitle && !allDone && (
                                      <div className="text-[10px] text-white/50 truncate max-w-[120px]" title={stageTitle}>
                                        {stageTitle}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
                                          style={{ width: `${progressPct}%` }}
                                        />
                                      </div>
                                      <span className="text-[9px] text-white/40">
                                        {completedStages}/{totalStages}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
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
                                      try {
                                        setSelectedTask(task);
                                        await fetchSubtasks(task.id);
                                         setCurrentView('detail');
                                      } catch (e) { console.error('Error opening task view:', e); }
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
                                try {
                                  setSelectedTask(task);
                                  await fetchSubtasks(task.id);
                                  setCurrentView('detail');
                                } catch (e) { console.error('Error opening task view:', e); }
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
                <Label htmlFor="edit_client">Client</Label>
                <Select
                  value={selectedTask.client_id}
                  onValueChange={(value) => {
                    setSelectedTask({ ...selectedTask, client_id: value, client_project_id: "" });
                    fetchClientProjects(value);
                  }}
                >
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
              {selectedTask.client_id && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="edit_client_project" className="mb-0">Client Project (Optional)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => setIsAddProjectDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New Project
                    </Button>
                  </div>
                  <Select
                    value={selectedTask.client_project_id}
                    onValueChange={(value) => setSelectedTask({ ...selectedTask, client_project_id: value })}
                    disabled={loadingProjects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select project (if any)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Individual Task</SelectItem>
                      {clientProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              {Array.isArray(selectedTask.attachments) && selectedTask.attachments.length > 0 && (
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

      {/* View Task Details - now handled by full-page TaskDetailPage via currentView */}

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
      {/* Add Project Dialog */}
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="max-w-md bg-[#0f0f0f] border-white/5 text-white">
          <DialogHeader>
            <DialogTitle>Initialize New Project</DialogTitle>
          </DialogHeader>
          <SharedProjectForm
            clientId={newTask.client_id}
            onSuccess={handleProjectSuccess}
            onCancel={() => setIsAddProjectDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Subtask Review Dialog */}
      <SubtaskReviewDialog
        subtask={reviewDialogSubtask}
        parentTask={reviewDialogSubtask ? tasks.find(t => t.id === reviewDialogSubtask.task_id) || (reviewDialogSubtask as any).staff_tasks : null}
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open) setReviewDialogSubtask(null);
        }}
        onApprove={async (subtaskId) => {
          await handleSubtaskApprove(subtaskId);
          fetchReviewQueues();
        }}
        onReject={async (subtaskId, note) => {
          await handleSubtaskReject(subtaskId, note);
          fetchReviewQueues();
        }}
      />
    </div >
  );
};

export default TeamHeadWorkspace;