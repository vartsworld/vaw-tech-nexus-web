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
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
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
  const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false);
  const [handoverTaskId, setHandoverTaskId] = useState<string | null>(null);
  const [handoverDepartmentId, setHandoverDepartmentId] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    assigned_by: "",
    project_id: "",
    client_id: "",
    status: "pending",
    priority: "medium",
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

  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchStaff();
    fetchProjects();
    fetchClients();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, filterStatus, filterPriority]);

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

      // Get unique IDs for batch fetching
      const assignedToIds = [...new Set(tasksData.map(t => t.assigned_to).filter(Boolean))];
      const assignedByIds = [...new Set(tasksData.map(t => t.assigned_by).filter(Boolean))];
      const projectIds = [...new Set(tasksData.map(t => t.project_id).filter(Boolean))];
      const clientIds = [...new Set(tasksData.map(t => t.client_id).filter(Boolean))];

      // Fetch related data in parallel
      const [profilesData, projectsData, clientsData] = await Promise.all([
        supabase.from('staff_profiles').select('id, user_id, full_name, username, avatar_url, role').in('user_id', [...assignedToIds, ...assignedByIds]),
        projectIds.length > 0 ? supabase.from('staff_projects').select('id, name, status').in('id', projectIds) : { data: [] },
        clientIds.length > 0 ? supabase.from('clients').select('id, company_name, contact_person, email, phone').in('id', clientIds) : { data: [] }
      ]);

      // Create lookup maps using user_id
      const profilesMap = (profilesData.data || []).reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {});
      const projectsMap = (projectsData.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      const clientsMap = (clientsData.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

      // Merge data
      let enrichedTasks = tasksData.map(task => ({
        ...task,
        assigned_to_profile: profilesMap[task.assigned_to] || null,
        assigned_by_profile: profilesMap[task.assigned_by] || null,
        staff_projects: task.project_id ? projectsMap[task.project_id] || null : null,
        clients: task.client_id ? clientsMap[task.client_id] || null : null
      }));

      // Filter handover tasks: show to department heads and managers in same department
      if (currentUserProfile && currentUserProfile.role !== 'hr') {
        enrichedTasks = enrichedTasks.filter(task => {
          // Always show tasks assigned to or by the current user
          if (task.assigned_to === user?.id || task.assigned_by === user?.id) {
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

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, full_name, username, role')
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
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

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.assigned_to) {
      toast({
        title: "Validation Error",
        description: "Title and Assignee are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFiles(true);
      // Get current user's ID for assigned_by
      const { data: { user } } = await supabase.auth.getUser();

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        assigned_by: user?.id || crypto.randomUUID(),
        project_id: newTask.project_id === "no-project" ? null : newTask.project_id,
        client_id: newTask.client_id === "no-client" ? null : newTask.client_id,
        priority: newTask.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: newTask.status as 'pending' | 'in_progress' | 'completed',
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        trial_period: newTask.trial_period,
        points: newTask.points,
        department_id: userProfile?.department_id || null, // Ensure department_id is set
        attachments: []
      };

      const { data: taskResponse, error: taskError } = await supabase
        .from('staff_tasks')
        .insert(taskData)
        .select('*')
        .single();

      if (taskError) throw taskError;

      // Handle attachments
      let finalAttachments = [];
      if (newTask.attachments.length > 0) {
        for (const attachment of newTask.attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const filePath = `${taskResponse.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, attachment.file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast({
              title: "Warning",
              description: `Failed to upload ${attachment.file.name}`,
              variant: "destructive",
            });
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(filePath);

          finalAttachments.push({
            title: attachment.title || attachment.file.name,
            name: attachment.file.name,
            url: filePath,
            publicUrl: publicUrl,
            size: attachment.file.size,
            type: attachment.file.type
          });
        }

        if (finalAttachments.length > 0) {
          const { error: updateError } = await supabase
            .from('staff_tasks')
            .update({ attachments: finalAttachments })
            .eq('id', taskResponse.id);

          if (updateError) console.error('Error updating task attachments:', updateError);
        }
      }

      // Refresh tasks list
      const newTaskWithAttachments = { ...taskResponse, attachments: finalAttachments };
      setTasks([newTaskWithAttachments, ...tasks]);

      setIsAddDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        assigned_by: "",
        project_id: "",
        client_id: "",
        status: "pending",
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

  const updateTaskStatus = async (taskId, newStatus, departmentId?: string) => {
    // Only allow HR or Dept Head to mark as completed directly and award points
    // Regular staff can mark as review_pending
    const isAuthorized = userProfile?.role === 'hr' || userProfile?.role === 'admin' || userProfile?.is_department_head;

    // If setting to completed and not authorized, force review_pending or show error
    // But since we control the UI options, we assume the call is valid for the context
    // Ideally we double check here

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

      // Award points if task is completed
      if (newStatus === 'completed' && data) {
        const pointsToAward = data.points || 10;

        // Get current staff profile points
        const { data: staffProfile } = await supabase
          .from('staff_profiles')
          .select('total_points')
          .eq('user_id', data.assigned_to)
          .single();

        // Update staff total points
        await supabase
          .from('staff_profiles')
          .update({
            total_points: (staffProfile?.total_points || 0) + pointsToAward
          })
          .eq('user_id', data.assigned_to);

        // Log points
        await supabase
          .from('user_points_log')
          .insert({
            user_id: data.assigned_to,
            points: pointsToAward,
            reason: `Task completed: ${data.title}`,
            category: 'task'
          });

        toast({
          title: "Success",
          description: `Task approved & completed! +${pointsToAward} points awarded.`,
        });
      } else if (newStatus === 'review_pending') {
        toast({
          title: "Submitted",
          description: "Task submitted for approval.",
        });
      } else {
        toast({
          title: "Success",
          description: newStatus === 'handover'
            ? "Task handed over successfully."
            : "Task status updated successfully.",
        });
      }

      // Create notification for the user
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
          notificationType = "task_assigned";
        } else if (newStatus === 'handover') {
          notificationTitle = "Task Handed Over";
          notificationContent = `Task "${data.title}" has been handed over.`;
          notificationType = "task_assigned";
        }

        if (notificationTitle) {
          await supabase
            .from('staff_notifications')
            .insert({
              title: notificationTitle,
              content: notificationContent,
              type: notificationType,
              target_users: [data.assigned_to],
              created_by: userProfile?.user_id,
              is_urgent: false
            });
        }
      }

      await fetchTasks(); // Refresh tasks to get updated data
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Target },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      review_pending: { color: 'bg-orange-100 text-orange-800', icon: Eye },
      handover: { color: 'bg-purple-100 text-purple-800', icon: User },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, ' ').toUpperCase()}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Task Management</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        const currentUser = staff.find(s => s.user_id === user?.id);
                        if (currentUser) {
                          setNewTask({ ...newTask, assigned_to: currentUser.id });
                        }
                      }}
                    >
                      <User className="h-3 w-3 mr-1" />
                      Assign to myself
                    </Button>
                  </div>
                  <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}>
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
                    <Label htmlFor="client">Client</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger className="mt-2">
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
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      id="points"
                      type="number"
                      value={newTask.points}
                      onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 10 })}
                      min="1"
                      max="100"
                      className="flex-1"
                      disabled={newTask.trial_period}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        id="trial_period"
                        checked={newTask.trial_period}
                        onCheckedChange={(checked) => setNewTask({ ...newTask, trial_period: checked, points: checked ? 0 : 10 })}
                      />
                      <Label htmlFor="trial_period" className="text-sm text-muted-foreground whitespace-nowrap">
                        Trial Period
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="due_time">Due Time (Optional)</Label>
                  <Input
                    id="due_time"
                    type="time"
                    value={newTask.due_time}
                    onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Attachments</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files).map(file => ({
                            file,
                            title: file.name
                          }));
                          setNewTask({ ...newTask, attachments: [...newTask.attachments, ...files] });
                        }
                        e.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingFiles}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach Files
                    </Button>
                  </div>

                  {newTask.attachments.length > 0 && (
                    <div className="space-y-2">
                      {newTask.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded border text-sm">
                          <span className="truncate flex-1">{att.title}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              const newAttachments = [...newTask.attachments];
                              newAttachments.splice(idx, 1);
                              setNewTask({ ...newTask, attachments: newAttachments });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTask} disabled={uploadingFiles}>
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </div>
            </div>
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
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={newClient.contact_person}
                  onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
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
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Enter any notes"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned To</TableHead>
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
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                        {task.staff_projects?.name && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {task.staff_projects.name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {task.assigned_to_profile?.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{task.assigned_to_profile?.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(task.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          {task.due_time && <span className="text-xs text-muted-foreground">{task.due_time}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="w-32">
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
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {task.status === 'review_pending' &&
                          (userProfile?.role === 'hr' || userProfile?.role === 'admin' || userProfile?.is_department_head) && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            setTaskToDelete(task);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{task.assigned_to_profile?.full_name}</span>
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
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDetailDialogOpen(true);
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
      <Dialog open={isHandoverDialogOpen} onOpenChange={setIsHandoverDialogOpen}>
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

      {/* Task Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{selectedTask.title}</h3>
                  <p className="text-muted-foreground">{selectedTask.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Points</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedTask.points} pts</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <div className="mt-1 text-sm">
                      {selectedTask.due_date ? format(new Date(selectedTask.due_date), 'MMM dd, yyyy') : 'No due date'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assignment Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <div>
                        <div className="font-medium">{selectedTask.assigned_to_profile?.full_name}</div>
                        <div className="text-sm text-muted-foreground">@{selectedTask.assigned_to_profile?.username}</div>
                        <Badge variant="outline" className="mt-1 text-xs">{selectedTask.assigned_to_profile?.role}</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Assigned By</Label>
                    <div className="mt-1">
                      <div className="font-medium">{selectedTask.assigned_by_profile?.full_name}</div>
                      <div className="text-sm text-muted-foreground">@{selectedTask.assigned_by_profile?.username}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project & Client Info */}
              {(selectedTask.staff_projects || selectedTask.clients) && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Project & Client Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTask.staff_projects && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Project</Label>
                        <div className="mt-1">
                          <div className="font-medium">{selectedTask.staff_projects.name}</div>
                          <Badge variant="outline" className="mt-1 text-xs">{selectedTask.staff_projects.status}</Badge>
                        </div>
                      </div>
                    )}
                    {selectedTask.clients && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Client</Label>
                        <div className="mt-1">
                          <div className="font-medium">{selectedTask.clients.company_name}</div>
                          <div className="text-sm text-muted-foreground">{selectedTask.clients.contact_person}</div>
                          {selectedTask.clients.email && (
                            <div className="text-xs text-muted-foreground mt-1">{selectedTask.clients.email}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <div className="mt-1">{format(new Date(selectedTask.created_at), 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                  {selectedTask.updated_at && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Updated</Label>
                      <div className="mt-1">{format(new Date(selectedTask.updated_at), 'MMM dd, yyyy HH:mm')}</div>
                    </div>
                  )}
                  {selectedTask.completed_at && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Completed At</Label>
                      <div className="mt-1">{format(new Date(selectedTask.completed_at), 'MMM dd, yyyy HH:mm')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Handover History */}
              {selectedTask.comments && selectedTask.comments.some((c: any) => c.type === 'handover') && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Handover History
                  </h4>
                  <div className="space-y-2">
                    {selectedTask.comments
                      .filter((c: any) => c.type === 'handover')
                      .map((handover: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{handover.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(handover.timestamp), 'MMM dd, yyyy HH:mm')}
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

              {/* Comments */}
              {selectedTask.comments && selectedTask.comments.filter((c: any) => c.type !== 'handover').length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({selectedTask.comments.filter((c: any) => c.type !== 'handover').length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTask.comments.filter((c: any) => c.type !== 'handover').map((comment: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm">{comment.user_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at || comment.timestamp), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        <p className="text-sm">{comment.content || comment.message}</p>
                        {comment.attachment_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => handleDownloadAttachment({ url: comment.attachment_url, name: comment.attachment_name })}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {comment.attachment_name || 'Download'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Attachments ({selectedTask.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTask.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="border rounded p-3 flex items-center justify-between bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm font-medium truncate">{attachment.name || `Attachment ${index + 1}`}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
  );
};

export default TaskManagement;