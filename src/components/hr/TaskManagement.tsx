import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";

import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  Flag,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Eye,
  Download,
  FileText,
  MessageSquare,
  Trash2,
  Paperclip,
  X,
  Loader2,
  Repeat,
  ChevronDown,
  Check,
  Edit,
  LayoutTemplate,
  ChevronRight,
  LayoutGrid,
  List,
  Layers,
  Trello,
  Maximize2,
  Minimize2
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TaskCreatePage from "./TaskCreatePage";
import TaskDetailPage from "./TaskDetailPage";

const TaskManagement = () => {

  // Helper: parse assigned_to which may be a plain UUID or a JSON array string
  const parseAssignedTo = (val: string | null | undefined): string[] => {
    if (!val) return [];
    if (val.startsWith('[')) {
      try { return JSON.parse(val); } catch { return [val]; }
    }
    return [val];
  };

  // Helper: serialize assignee array back for storage
  const serializeAssignedTo = (ids: string[]): string | null => {
    if (ids.length === 0) return null;
    if (ids.length === 1) return ids[0];
    return JSON.stringify(ids);
  };

  const [currentView, setCurrentView] = useState<'list' | 'create' | 'detail'>('list');
  const [tasks, setTasks] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('table');
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false);
  const [handoverTaskId, setHandoverTaskId] = useState<string | null>(null);
  const [handoverDepartmentId, setHandoverDepartmentId] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [subtaskTemplates, setSubtaskTemplates] = useState<any[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<any[]>([]);
  const [selectedSubtaskTemplateId, setSelectedSubtaskTemplateId] = useState<string>("none");
  const [selectedTaskTemplateId, setSelectedTaskTemplateId] = useState<string>("none");
  const [bulkSubtasks, setBulkSubtasks] = useState<any[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubtaskFullScreen, setIsSubtaskFullScreen] = useState(false);

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
  // Track which stage column has the quick-add form open
  const [quickAddStage, setQuickAddStage] = useState<number | null>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: [] as string[],
    assigned_by: "",
    project_id: "",
    client_id: "",
    department_id: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    due_time: "",
    trial_period: false,
    points: 10,
    attachments: [] as Array<{ file: File; title: string }>,
    is_recurring: false,
    recurrence_type: "weekly" as string,
    recurrence_interval: 1,
    recurrence_end_date: "",
    current_stage: 1
  });

  const [newClient, setNewClient] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchStaff();
    fetchClients();
    fetchDepartments();
    fetchSubtaskTemplates();
    fetchTaskTemplates();
  }, []);

  // Fetch projects when client_id changes in newTask
  useEffect(() => {
    if (newTask.client_id && newTask.client_id !== "no-client" && isAddDialogOpen) {
      fetchClientProjects(newTask.client_id);
    }
  }, [newTask.client_id, isAddDialogOpen]);

  // Fetch projects when client_id changes in editTask
  useEffect(() => {
    if (editTask?.client_id && editTask.client_id !== "no-client" && isEditDialogOpen) {
      fetchClientProjects(editTask.client_id);
    }
  }, [editTask?.client_id, isEditDialogOpen]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, filterStatus, filterPriority]);

  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_tasks' }, () => {
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_subtasks' }, (payload: any) => {
        const taskId = payload?.new?.task_id || payload?.old?.task_id || selectedTask?.id;
        if (taskId) fetchSubtasks(taskId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTask]);

  const fetchTasks = async () => {
    try {
      // Get current user profile to check role and department
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentUserProfile } = await supabase
        .from('staff_profiles')
        .select('id, user_id, role, department_id, is_department_head, full_name, avatar_url')
        .eq('user_id', user?.id)
        .single();

      setUserProfile(currentUserProfile);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        return;
      }

      // Get unique IDs for batch fetching — handle JSON-array assigned_to
      const allAssignedToIds = [...new Set(
        tasksData.flatMap(t => parseAssignedTo(t.assigned_to))
      )].filter(Boolean);
      const assignedByIds = [...new Set(tasksData.map(t => t.assigned_by).filter(Boolean))];
      const deptIds = [...new Set(tasksData.map(t => t.department_id).filter(Boolean))];
      const projectIds = [...new Set(tasksData.map(t => t.client_project_id || t.project_id).filter(Boolean))];
      const clientIds = [...new Set(tasksData.map(t => t.client_id).filter(Boolean))];

      // Fetch related data in parallel — including departments inline to avoid race condition
      const [profilesData, projectsData, clientsData, deptsData] = await Promise.all([
        supabase.from('staff_profiles').select('id, user_id, full_name, username, avatar_url, role').in('user_id', [...allAssignedToIds, ...assignedByIds]),
        projectIds.length > 0 ? supabase.from('client_projects').select('id, title, status').in('id', projectIds) : { data: [] },
        clientIds.length > 0 ? supabase.from('clients').select('id, company_name, contact_person, email, phone').in('id', clientIds) : { data: [] },
        deptIds.length > 0 ? supabase.from('departments').select('id, name').in('id', deptIds) : { data: [] }
      ]);

      // Create lookup maps using user_id
      const profilesMap = (profilesData.data || []).reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {});
      const projectsMap = (projectsData.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      const clientsMap = (clientsData.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
      const deptsMap = (deptsData.data || []).reduce((acc: any, d: any) => ({ ...acc, [d.id]: d }), {});

      // Merge data — attach all assignee profiles
      let enrichedTasks = tasksData.map(task => {
        const assigneeIds = parseAssignedTo(task.assigned_to);
        return {
          ...task,
          assigned_to_ids: assigneeIds,
          assigned_to_profiles: assigneeIds.map((id: string) => profilesMap[id] || null).filter(Boolean),
          assigned_to_profile: assigneeIds[0] ? (profilesMap[assigneeIds[0]] || null) : null, // keep legacy compat
          assigned_by_profile: profilesMap[task.assigned_by] || null,
          staff_projects: (task.client_project_id || task.project_id) ? projectsMap[task.client_project_id || task.project_id] || null : null,
          clients: task.client_id ? clientsMap[task.client_id] || null : null,
          departments: task.department_id ? deptsMap[task.department_id] || null : null
        };
      });

      // Filter handover tasks: show to department heads and managers in same department
      if (currentUserProfile && currentUserProfile.role !== 'hr') {
        enrichedTasks = enrichedTasks.filter(task => {
          const assigneeIds: string[] = task.assigned_to_ids || [];
          // Always show tasks assigned to or by the current user
          if (assigneeIds.includes(user?.id) || task.assigned_by === user?.id) {
            return true;
          }

          // Show handover tasks to department heads and managers in the same department
          if (task.status === 'handover') {
            const isManagerOrHead = currentUserProfile.role === 'manager' || currentUserProfile.is_department_head;
            const sameDepartment = task.department_id === currentUserProfile.department_id;
            return isManagerOrHead && sameDepartment;
          }

          // For non-handover tasks, only show if assigned to/by current user
          return false;
        });
      }

      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
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
      const { data: { user } } = await supabase.auth.getUser();

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
          created_by: user?.id,
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

      if (error) throw error;

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
      setSelectedSubtaskTemplateId("none");

      toast({
        title: "Success",
        description: "Subtask created successfully.",
      });
    } catch (error: any) {
      console.error('Error creating subtask:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subtask.",
        variant: "destructive",
      });
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

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('staff_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
      toast({
        title: "Success",
        description: "Subtask deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "Error",
        description: "Failed to delete subtask.",
        variant: "destructive",
      });
    }
  };

  const handleSubtaskStatusUpdate = async (subtaskId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_subtasks')
        .update({ status: newStatus as any, updated_at: new Date().toISOString() })
        .eq('id', subtaskId)
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .single();

      if (error) throw error;

      setSubtasks(subtasks.map(st => st.id === subtaskId ? data : st));
      toast({
        title: "Success",
        description: "Subtask status updated.",
      });
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update subtask status.",
        variant: "destructive",
      });
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, username, role')
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchClientProjects = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_projects')
        .select('id, title')
        .eq('client_id', clientId)
        .order('title');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching client projects:', error);
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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigned_to_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    setFilteredTasks(filtered);
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

  const calculateNextRecurrence = (dueDate: string, type: string, interval: number): string => {
    const date = new Date(dueDate);
    switch (type) {
      case 'daily':
        date.setDate(date.getDate() + interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (7 * interval));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + interval);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const handleAddTask = async () => {
    if (!newTask.title || newTask.assigned_to.length === 0) {
      toast({
        title: "Validation Error",
        description: "Title and at least one Assignee are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFiles(true);
      // Get current user's ID for assigned_by
      const { data: { user } } = await supabase.auth.getUser();

      const taskData: any = {
        title: newTask.title,
        description: newTask.description,
        assigned_to: JSON.stringify(newTask.assigned_to),
        assigned_by: user?.id || crypto.randomUUID(),
        project_id: !newTask.project_id || newTask.project_id === "no-project" ? null : newTask.project_id,
        client_project_id: !newTask.project_id || newTask.project_id === "no-project" ? null : newTask.project_id,
        client_id: !newTask.client_id || newTask.client_id === "no-client" ? null : newTask.client_id,
        priority: newTask.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: newTask.status as 'pending' | 'in_progress' | 'completed',
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        trial_period: newTask.trial_period,
        points: newTask.points,
        department_id: newTask.department_id && newTask.department_id !== "no-department" ? newTask.department_id : (userProfile?.department_id || null),
        is_recurring: newTask.is_recurring,
        recurrence_type: newTask.is_recurring ? newTask.recurrence_type : null,
        recurrence_interval: newTask.is_recurring ? newTask.recurrence_interval : 1,
        recurrence_end_date: newTask.is_recurring && newTask.recurrence_end_date ? newTask.recurrence_end_date : null,
        next_recurrence_date: newTask.is_recurring && newTask.due_date ? calculateNextRecurrence(newTask.due_date, newTask.recurrence_type, newTask.recurrence_interval) : null,
        current_stage: newTask.current_stage || 1,
        attachments: []
      };

      const { data: taskResponse, error: taskError } = await supabase
        .from('staff_tasks')
        .insert(taskData)
        .select('*')
        .single();

      if (taskError) throw taskError;
      const createdTaskId = taskResponse.id;

      // Handle attachments
      if (newTask.attachments.length > 0 && createdTaskId) {
        for (const attachment of newTask.attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const filePath = `${createdTaskId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, attachment.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(filePath);

          const attachmentData = {
            task_id: createdTaskId,
            name: attachment.title || attachment.file.name,
            url: publicUrl,
            type: attachment.file.type,
            size: attachment.file.size
          };

          await (supabase.from('task_attachments' as any) as any).insert(attachmentData);
        }
      }
      toast({
        title: "Success",
        description: "Task created and assigned successfully.",
      });

      await fetchTasks();
      setIsAddDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: [],
        assigned_by: "",
        project_id: "",
        client_id: "",
        department_id: "",
        status: "pending",
        priority: "medium",
        due_date: "",
        due_time: "",
        trial_period: false,
        points: 10,
        attachments: [],
        is_recurring: false,
        recurrence_type: "weekly",
        recurrence_interval: 1,
        recurrence_end_date: "",
        current_stage: 1
      });

      toast({
        title: "Success",
        description: "Task created successfully.",
      });
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };



  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      // Delete attachments from storage if any
      if (taskToDelete.attachments && taskToDelete.attachments.length > 0) {
        const filePaths = taskToDelete.attachments.map((att: any) => att.url);
        await supabase.storage
          .from('task-attachments')
          .remove(filePaths);
      }

      // Delete task
      const { error } = await supabase
        .from('staff_tasks')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);

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

  const openEditDialog = (task: any) => {
    const assigneeIds = parseAssignedTo(task.assigned_to);

    // Fetch projects for this task's client
    if (task.client_id && task.client_id !== "no-client") {
      fetchClientProjects(task.client_id);
    }

    setEditTask({
      id: task.id,
      title: task.title || "",
      description: task.description || "",
      assigned_to: assigneeIds,
      project_id: task.client_project_id || task.project_id || "",
      client_id: task.client_id || "",
      department_id: task.department_id || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      due_date: task.due_date ? task.due_date.split('T')[0] : "",
      due_time: task.due_time || "",
      trial_period: task.trial_period || false,
      points: task.points || 10,
      is_recurring: task.is_recurring || false,
      recurrence_type: task.recurrence_type || "weekly",
      recurrence_interval: task.recurrence_interval || 1,
      recurrence_end_date: task.recurrence_end_date ? task.recurrence_end_date.split('T')[0] : "",
      current_stage: task.current_stage || 1,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditTask = async () => {
    if (!editTask || !editTask.title || editTask.assigned_to.length === 0) {
      toast({ title: "Validation Error", description: "Title and at least one Assignee are required.", variant: "destructive" });
      return;
    }

    try {
      setSavingEdit(true);

      const updateData: any = {
        title: editTask.title,
        description: editTask.description,
        assigned_to: serializeAssignedTo(editTask.assigned_to),
        project_id: editTask.project_id === "no-project" ? null : editTask.project_id || null,
        client_project_id: editTask.project_id === "no-project" ? null : editTask.project_id || null,
        client_id: editTask.client_id === "no-client" ? null : editTask.client_id || null,
        department_id: editTask.department_id === "no-department" ? null : editTask.department_id || null,
        status: editTask.status,
        priority: editTask.priority,
        due_date: editTask.due_date || null,
        due_time: editTask.due_time || null,
        trial_period: editTask.trial_period,
        points: editTask.points,
        is_recurring: editTask.is_recurring,
        recurrence_type: editTask.is_recurring ? editTask.recurrence_type : null,
        recurrence_interval: editTask.is_recurring ? editTask.recurrence_interval : 1,
        recurrence_end_date: editTask.is_recurring && editTask.recurrence_end_date ? editTask.recurrence_end_date : null,
        current_stage: editTask.current_stage || 1,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('staff_tasks')
        .update(updateData)
        .eq('id', editTask.id);

      if (error) throw error;

      toast({ title: "Success", description: `Task updated with ${editTask.assigned_to.length} assignee${editTask.assigned_to.length > 1 ? 's' : ''} successfully.` });
      setIsEditDialogOpen(false);
      setEditTask(null);
      await fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({ title: "Error", description: error.message || "Failed to update task.", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus, departmentId?: string) => {
    const isAuthorized = userProfile?.role === 'hr' || userProfile?.role === 'admin' || userProfile?.is_department_head;

    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (newStatus === 'handover' && departmentId) {
        updateData.department_id = departmentId;
      }

      const { data, error } = await supabase
        .from('staff_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) throw error;

      if (newStatus === 'completed' && data) {
        const pointsToAward = data.points || 10;
        const assigneeIds = parseAssignedTo(data.assigned_to);

        for (const userId of assigneeIds) {
          const { data: staffProfile } = await supabase
            .from('staff_profiles')
            .select('total_points')
            .eq('user_id', userId)
            .single();

          await supabase
            .from('staff_profiles')
            .update({
              total_points: (staffProfile?.total_points || 0) + pointsToAward
            })
            .eq('user_id', userId);

          await supabase
            .from('user_points_log')
            .insert({
              user_id: userId,
              points: pointsToAward,
              reason: `Task completed: ${data.title}`,
              category: 'task'
            });
        }

        toast({
          title: "Success",
          description: `Task approved & completed! +${pointsToAward} points awarded to ${assigneeIds.length} users.`,
        });
      } else if (newStatus === 'review_pending') {
        toast({ title: "Submitted", description: "Task submitted for approval." });
      } else {
        toast({
          title: "Success",
          description: newStatus === 'handover' ? "Task handed over successfully." : "Task status updated successfully.",
        });
      }

      if (newStatus === 'completed' || newStatus === 'review_pending' || newStatus === 'handover') {
        let notificationTitle = "";
        let notificationContent = "";
        let notificationType = "task_assigned";

        if (newStatus === 'completed') {
          notificationTitle = "Task Approved & Completed";
          notificationContent = `Your task "${data.title}" has been approved and completed. ${data.points ? `You earned ${data.points} points!` : ''}`;
          notificationType = "achievement";
        } else if (newStatus === 'review_pending') {
          notificationTitle = "Task Submitted for Review";
          notificationContent = `Task "${data.title}" has been submitted for review.`;
        } else if (newStatus === 'handover') {
          notificationTitle = "Task Handed Over";
          notificationContent = `Task "${data.title}" has been handed over.`;
        }

        if (notificationTitle) {
          const assigneeIds = parseAssignedTo(data.assigned_to);
          await supabase
            .from('staff_notifications')
            .insert({
              title: notificationTitle,
              content: notificationContent,
              type: notificationType,
              target_users: assigneeIds,
              created_by: userProfile?.user_id,
              is_urgent: false
            } as any);
        }
      }

      await fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({ title: "Error", description: "Failed to update task status.", variant: "destructive" });
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    if (newStatus === 'handover') {
      setHandoverTaskId(taskId);
      setHandoverDepartmentId("");
      setIsHandoverDialogOpen(true);
    } else {
      updateTaskStatus(taskId, newStatus);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    const task = tasks.find(t => t.id === draggableId);
    if (task && task.status !== newStatus) {
      handleStatusChange(draggableId, newStatus);
    }
  };

  const onSubtaskDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const destinationId = destination.droppableId;

    if (destinationId.startsWith('stage-')) {
      const newStage = parseInt(destinationId.replace('stage-', ''));
      const subtask = subtasks.find(st => st.id === draggableId);
      if (subtask && subtask.stage !== newStage) {
        handleSubtaskStageUpdate(draggableId, newStage);
      }
    }
  };

  const handleSubtaskStageUpdate = async (subtaskId: string, newStage: number) => {
    try {
      const { error } = await supabase
        .from('staff_subtasks')
        .update({ stage: newStage })
        .eq('id', subtaskId);

      if (error) throw error;
      setSubtasks(prev => prev.map(st => st.id === subtaskId ? { ...st, stage: newStage } : st));
    } catch (error) {
      console.error('Error updating subtask stage:', error);
    }
  };

  const handleHandoverConfirm = async () => {
    if (!handoverTaskId || !handoverDepartmentId) {
      toast({
        title: "Error",
        description: "Please select a department to hand over to.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentUserProfile } = await supabase
        .from('staff_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user?.id)
        .single();

      // Get the task
      const { data: task } = await supabase
        .from('staff_tasks')
        .select('*')
        .eq('id', handoverTaskId)
        .single();

      // Get current department name if exists
      let fromDeptName = 'Unknown';
      if (task?.department_id) {
        const { data: fromDept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', task.department_id)
          .single();
        fromDeptName = fromDept?.name || 'Unknown';
      }

      // Get target department name
      const { data: targetDept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', handoverDepartmentId)
        .single();

      // Create handover history comment
      const handoverComment = {
        type: 'handover',
        user_name: currentUserProfile?.full_name || 'Unknown',
        user_avatar: currentUserProfile?.avatar_url || null,
        timestamp: new Date().toISOString(),
        message: 'Task handed over',
        from_department: fromDeptName,
        to_department: targetDept?.name || 'Unknown',
        from_department_id: task?.department_id,
        to_department_id: handoverDepartmentId
      };

      // Update task with handover history
      const existingComments = Array.isArray(task?.comments) ? task.comments : [];
      const updatedComments = [...existingComments, handoverComment];

      const { error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'handover',
          department_id: handoverDepartmentId,
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', handoverTaskId);

      if (error) throw error;

      await fetchTasks();

      toast({
        title: "Success",
        description: "Task handed over successfully.",
      });

      setIsHandoverDialogOpen(false);
      setHandoverTaskId(null);
      setHandoverDepartmentId("");
    } catch (error) {
      console.error('Error handing over task:', error);
      toast({
        title: "Error",
        description: "Failed to handover task.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const statusConfig: any = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Target },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      review_pending: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: Eye },
      handover: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: User },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle }
    };

    const config = statusConfig[statusValue] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color} variant="secondary">
        <Icon className="h-3 w-3 mr-1" />
        {statusValue.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStageBadge = (stage: number | null | undefined, taskStageNames?: any) => {
    if (!stage) return null;
    const names: Record<string, string> = (taskStageNames && typeof taskStageNames === 'object') ? taskStageNames : {};
    const label = names[String(stage)] || `Stage ${stage}`;
    return (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
        <Layers className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
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

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Error",
        description: "Failed to download attachment.",
        variant: "destructive",
      });
    }
  };

  // Render Create Page
  if (currentView === 'create') {
    return (
      <TaskCreatePage
        onBack={() => setCurrentView('list')}
        onCreated={() => { fetchTasks(); setCurrentView('list'); }}
        userProfile={userProfile}
      />
    );
  }

  // Render Detail Page
  if (currentView === 'detail' && selectedTask) {
    return (
      <TaskDetailPage
        task={selectedTask}
        onBack={() => { setCurrentView('list'); setSelectedTask(null); }}
        onStatusUpdate={(taskId, status) => {
          handleStatusChange(taskId, status);
        }}
        onEdit={(t) => { openEditDialog(t); }}
        onDelete={(t) => { setTaskToDelete(t); setIsDeleteDialogOpen(true); }}
        userProfile={userProfile}
        staff={staff}
        subtaskTemplates={subtaskTemplates}
        taskTemplates={taskTemplates}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Task Management</h2>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setCurrentView('create')}>
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="handover">Handover</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-2"
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-2"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-2"
                >
                  <Trello className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
                <Button
                  variant={isFullScreen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="h-8 px-2"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen Kanban"}
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {filteredTasks.length} tasks
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Dynamic Content: Table, Grid or Kanban */}
            <div className="space-y-4">
              {viewMode === 'table' ? (
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="max-w-[200px]">
                              <div className="font-semibold truncate">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {task.description}
                                </div>
                              )}
                              {(task.staff_projects?.title || task.staff_projects?.name) && (
                                <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                                  {task.staff_projects?.title || task.staff_projects?.name}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.departments?.name ? (
                              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 border-primary/20 bg-primary/5 text-primary/80">
                                {task.departments.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex -space-x-3 hover:space-x-1 transition-all">
                              {(task.assigned_to_profiles?.length > 0
                                ? task.assigned_to_profiles
                                : task.assigned_to_profile ? [task.assigned_to_profile] : []
                              ).map((profile: any, i: number) => (
                                <Tooltip key={i}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-primary/10 hover:z-10 transition-all hover:scale-110 shadow-sm cursor-pointer">
                                      <AvatarImage src={profile.avatar_url} />
                                      <AvatarFallback className="text-[10px] bg-muted font-bold text-muted-foreground">
                                        {profile.full_name?.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-semibold">{profile.full_name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {!task.assigned_to_profile && !task.assigned_to_profiles?.length && (
                                <span className="text-gray-400 text-xs italic">Unassigned</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStageBadge(task.current_stage || 1)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(task.priority)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(task.status)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {task.due_date ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(task.due_date), 'MMM dd')}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-mono">{task.points}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleStatusChange(task.id, value)}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                {(userProfile?.role === 'hr' || userProfile?.role === 'admin' || userProfile?.is_department_head) ? (
                                  <SelectItem value="completed">Completed</SelectItem>
                                ) : null}
                                <SelectItem value="review_pending">Review</SelectItem>
                                <SelectItem value="handover">Handover</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => { setSelectedTask(task); setCurrentView('detail'); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500" onClick={() => openEditDialog(task)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => { setTaskToDelete(task); setIsDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid/Card View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden hover:shadow-md transition-all group border-muted-foreground/10 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1 pr-6 overflow-hidden">
                          <CardTitle className="text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
                            {task.title}
                          </CardTitle>
                          {(task.staff_projects?.title || task.staff_projects?.name) && (
                            <p className="text-[10px] text-primary/70 font-medium">#{task.staff_projects?.title || task.staff_projects?.name}</p>
                          )}
                          {task.departments?.name && (
                            <div className="pt-0.5">
                              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 border-primary/20 bg-primary/5 text-primary/80">
                                {task.departments.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {getPriorityBadge(task.priority)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-4">
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {(task.assigned_to_profiles?.length > 0
                              ? task.assigned_to_profiles
                              : task.assigned_to_profile ? [task.assigned_to_profile] : []
                            ).map((profile: any, i: number) => (
                              <Avatar key={i} className="h-7 w-7 border-2 border-background ring-1 ring-border">
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback className="text-[10px]">
                                  {profile.full_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStageBadge(task.current_stage || 1)}
                            <span className="text-[10px] text-muted-foreground">Points: {task.points}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'No date'}
                            </span>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-[11px] bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                            onClick={() => {
                              setSelectedTask(task);
                              setCurrentView('detail');
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                            onClick={() => {
                              setTaskToDelete(task);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Kanban View */
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className={cn(
                    "flex gap-4 overflow-x-auto pb-6 custom-scrollbar min-h-[600px] items-start transition-all",
                    isFullScreen && "fixed inset-0 z-[100] bg-background p-8 flex-col overflow-y-auto"
                  )}>
                    {isFullScreen && (
                      <div className="flex justify-between items-center mb-6 shrink-0 w-full max-w-[1600px] mx-auto">
                        <div className="flex items-center gap-3">
                          <Trello className="h-8 w-8 text-primary" />
                          <h1 className="text-3xl font-bold tracking-tight">Main Task Board</h1>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setIsFullScreen(false)}
                          className="flex items-center gap-2 border-primary/20 hover:bg-primary/5"
                        >
                          <Minimize2 className="h-5 w-5" />
                          Exit Full Screen
                        </Button>
                      </div>
                    )}
                    <div className={cn(
                      "flex gap-4 min-h-0",
                      isFullScreen ? "w-full max-w-[1600px] mx-auto pb-12" : ""
                    )}>
                      {['pending', 'in_progress', 'review_pending', 'handover', 'completed'].map((status) => {
                        const statusTasks = filteredTasks.filter(t => t.status === status);
                        const statusColor = {
                          pending: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
                          in_progress: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
                          review_pending: 'bg-orange-500/10 border-orange-500/20 text-orange-600',
                          handover: 'bg-purple-500/10 border-purple-500/20 text-purple-600',
                          completed: 'bg-green-500/10 border-green-500/20 text-green-600'
                        }[status];

                        return (
                          <div key={status} className="flex-shrink-0 w-80 flex flex-col max-h-full">
                            <div className={`p-3 rounded-t-xl border-x border-t font-bold flex items-center justify-between ${statusColor}`}>
                              <div className="flex items-center gap-2">
                                <span className="uppercase text-xs tracking-wider">{status.replace(/_/g, ' ')}</span>
                                <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-[10px] h-4">
                                  {statusTasks.length}
                                </Badge>
                              </div>
                            </div>

                            <Droppable droppableId={status}>
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={`flex-1 p-3 border rounded-b-xl bg-muted/20 space-y-3 min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-muted/40 shadow-inner' : ''
                                    }`}
                                >
                                  {statusTasks.map((task, index) => (
                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className="transition-transform"
                                        >
                                          <Card className={`group relative bg-card hover:shadow-lg transition-all border-muted-foreground/10 ${snapshot.isDragging ? 'rotate-2 scale-105 z-50 shadow-2xl ring-2 ring-primary/20' : ''
                                            }`}>
                                            <CardHeader className="p-3 space-y-1">
                                              <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-sm font-bold truncate">
                                                  {task.title}
                                                </CardTitle>
                                                {getPriorityBadge(task.priority)}
                                              </div>
                                              {(task.staff_projects?.title || task.staff_projects?.name) && (
                                                <p className="text-[10px] text-primary/60 font-medium truncate">#{task.staff_projects?.title || task.staff_projects?.name}</p>
                                              )}
                                              {task.departments?.name && (
                                                <div className="pt-0.5">
                                                  <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 border-primary/20 bg-primary/5 text-primary/80">
                                                    {task.departments.name}
                                                  </Badge>
                                                </div>
                                              )}
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0 space-y-3">
                                              {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                  {task.description}
                                                </p>
                                              )}

                                              <div className="flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                  {(task.assigned_to_profiles?.length > 0
                                                    ? task.assigned_to_profiles
                                                    : task.assigned_to_profile ? [task.assigned_to_profile] : []
                                                  ).slice(0, 3).map((profile: any, i: number) => (
                                                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                                      <AvatarImage src={profile.avatar_url} />
                                                      <AvatarFallback className="text-[8px] font-bold">
                                                        {profile.full_name?.substring(0, 2).toUpperCase()}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  ))}
                                                  {(task.assigned_to_profiles?.length || 1) > 3 && (
                                                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold">
                                                      +{(task.assigned_to_profiles?.length || 1) - 3}
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                  {getStageBadge(task.current_stage || 1)}
                                                </div>
                                              </div>

                                              <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                                  <span className="text-[9px] text-muted-foreground">
                                                    {task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'No date'}
                                                  </span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setSelectedTask(task); setCurrentView('detail'); }}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditDialog(task)}>
                                                    <Edit className="h-3.5 w-3.5" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DragDropContext>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 col-span-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {(task.assigned_to_profiles?.length > 0
                          ? task.assigned_to_profiles
                          : task.assigned_to_profile ? [task.assigned_to_profile] : []
                        ).map((profile: any, i: number) => (
                          <span key={i} className="text-sm font-medium">
                            {profile.full_name}{i < (task.assigned_to_profiles?.length || 1) - 1 ? ',' : ''}
                          </span>
                        ))}
                        {!task.assigned_to_profile && !task.assigned_to_profiles?.length && (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant="outline">{task.points} pts</Badge>
                    </div>

                    {task.due_date && (
                      <div className="flex items-center gap-2 col-span-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          {task.due_time && ` at ${task.due_time}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      {getStatusBadge(task.status)}
                    </div>

                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        {(userProfile?.role === 'hr' || userProfile?.role === 'admin' || userProfile?.is_department_head) ? (
                          <SelectItem value="completed">Completed (Approve & Award)</SelectItem>
                        ) : null}
                        <SelectItem value="review_pending">Submit for Review</SelectItem>
                        <SelectItem value="handover">Handover</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2 justify-end">
                      {task.status === 'review_pending' &&
                        (userProfile?.role === 'hr' || userProfile?.role === 'admin' || userProfile?.is_department_head) && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(task)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTask(task);
                          setCurrentView('detail');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          setTaskToDelete(task);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Handover Dialog */}
        <Dialog open={isHandoverDialogOpen} onOpenChange={setIsHandoverDialogOpen} >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Handover Task to Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="handover-department">Select Target Department</Label>
                <Select value={handoverDepartmentId} onValueChange={setHandoverDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  The task will be handed over to this department's team lead and managers.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsHandoverDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleHandoverConfirm}>
                  Confirm Handover
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editTask && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Task Title</Label>
                  <Input
                    id="edit-title"
                    value={editTask.title}
                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editTask.description}
                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between mt-2 h-auto min-h-[40px] py-2"
                        >
                          <div className="flex flex-wrap gap-1 max-w-[90%]">
                            {editTask.assigned_to.length > 0 ? (
                              editTask.assigned_to.map((id) => {
                                const member = staff.find(s => s.user_id === id);
                                return (
                                  <Badge key={id} variant="secondary" className="mr-1 mb-1">
                                    {member?.full_name || id}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground">Select staff members...</span>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                          {staff.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                              onClick={() => {
                                const isSelected = editTask.assigned_to.includes(member.user_id);
                                if (isSelected) {
                                  setEditTask({
                                    ...editTask,
                                    assigned_to: editTask.assigned_to.filter(id => id !== member.user_id)
                                  });
                                } else {
                                  setEditTask({
                                    ...editTask,
                                    assigned_to: [...editTask.assigned_to, member.user_id]
                                  });
                                }
                              }}
                            >
                              <Checkbox
                                id={`edit-staff-${member.id}`}
                                checked={editTask.assigned_to.includes(member.user_id)}
                                onCheckedChange={() => { }} // Handled by div onClick
                              />
                              <div className="flex flex-col">
                                <Label htmlFor={`edit-staff-${member.id}`} className="cursor-pointer font-medium">
                                  {member.full_name}
                                </Label>
                                <span className="text-xs text-muted-foreground">@{member.username}</span>
                              </div>
                              {editTask.assigned_to.includes(member.user_id) && (
                                <Check className="h-4 w-4 ml-auto text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="edit-client">Client</Label>
                    <Select value={editTask.client_id || "no-client"} onValueChange={(value) => setEditTask({ ...editTask, client_id: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-client">No Client</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editTask.status} onValueChange={(value) => setEditTask({ ...editTask, status: value })}>
                      <SelectTrigger className="mt-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="review_pending">Review Pending</SelectItem>
                        <SelectItem value="handover">Handover</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select value={editTask.priority} onValueChange={(value) => setEditTask({ ...editTask, priority: value })}>
                      <SelectTrigger className="mt-2 text-xs">
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
                    <Label htmlFor="edit-stage">Evolution Stage</Label>
                    <Input
                      id="edit-stage"
                      type="number"
                      min="1"
                      value={editTask.current_stage || 1}
                      onChange={(e) => setEditTask({ ...editTask, current_stage: parseInt(e.target.value) || 1 })}
                      className="mt-2 h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-points">Points</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Input
                        id="edit-points"
                        type="number"
                        value={editTask.points}
                        onChange={(e) => setEditTask({ ...editTask, points: parseInt(e.target.value) || 10 })}
                        min="1"
                        max="100"
                        className="flex-1"
                        disabled={editTask.trial_period}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id="edit-trial"
                          checked={editTask.trial_period}
                          onCheckedChange={(checked) => setEditTask({ ...editTask, trial_period: checked, points: checked ? 0 : 10 })}
                        />
                        <Label htmlFor="edit-trial" className="text-sm text-muted-foreground whitespace-nowrap">
                          Trial Period
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-project">Project</Label>
                    <Select value={editTask.project_id || "no-project"} onValueChange={(value) => setEditTask({ ...editTask, project_id: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">No Project</SelectItem>
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title || project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select value={editTask.department_id || "no-department"} onValueChange={(value) => setEditTask({ ...editTask, department_id: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-department">No Department</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-current_stage">Current Stage</Label>
                  <Select value={editTask.current_stage?.toString() || "1"} onValueChange={(value) => setEditTask({ ...editTask, current_stage: parseInt(value) })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                        <SelectItem key={s} value={s.toString()}>Stage {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-due_date">Due Date</Label>
                    <Input
                      id="edit-due_date"
                      type="date"
                      value={editTask.due_date}
                      onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-due_time">Due Time</Label>
                    <Input
                      id="edit-due_time"
                      type="time"
                      value={editTask.due_time}
                      onChange={(e) => setEditTask({ ...editTask, due_time: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Recurring Task Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="edit-recurring" className="font-medium">Recurring Task</Label>
                    </div>
                    <Switch
                      id="edit-recurring"
                      checked={editTask.is_recurring}
                      onCheckedChange={(checked) => setEditTask({ ...editTask, is_recurring: checked })}
                    />
                  </div>
                  {editTask.is_recurring && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div>
                        <Label>Frequency</Label>
                        <Select value={editTask.recurrence_type} onValueChange={(value) => setEditTask({ ...editTask, recurrence_type: value })}>
                          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Every</Label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={editTask.recurrence_interval}
                          onChange={(e) => setEditTask({ ...editTask, recurrence_interval: parseInt(e.target.value) || 1 })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={editTask.recurrence_end_date}
                          onChange={(e) => setEditTask({ ...editTask, recurrence_end_date: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditTask} disabled={savingEdit}>
                    {savingEdit ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
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
                Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone and will also delete all attached files.
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
      </div>
    </TooltipProvider>
  );
};

export default TaskManagement;
