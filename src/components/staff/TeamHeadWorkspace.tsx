import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  FileText
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffData } from "@/hooks/useStaffData";
import MusicPlayer from "./MusicPlayer";

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points: number;
  due_date?: string;
  due_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  staff_profiles?: any;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  due_time?: string;
  trial_period?: boolean;
  attachments?: any[];
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
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
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
  const { notes, addNote } = useStaffData();
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const { toast } = useToast();

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    due_date: "",
    due_time: "",
    trial_period: false,
    points: 10,
    attachments: [] as Array<{ file: File; title: string }>
  });

  const [handoverData, setHandoverData] = useState({
    target_department: "",
    notes: ""
  });

  useEffect(() => {
    fetchTasks();
    fetchStaff();
    fetchDepartments();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_tasks')
        .select(`
          *,
          staff_profiles:assigned_to (
            full_name,
            username
          )
        `)
        .or(`assigned_by.eq.${userId},assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
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
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, username, department_id')
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
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

      if (error) throw error;

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
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to create subtask.",
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
    } catch (error) {
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
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
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

      if (error) throw error;

      setSubtasks(subtasks.map(st => st.id === subtaskId ? data : st));

      toast({
        title: "Success",
        description: "Subtask status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update subtask status.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    try {
      setUploadingFiles(true);
      
      // First create the task
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        trial_period: newTask.trial_period,
        points: newTask.points,
        assigned_by: userId,
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
        for (const attachment of newTask.attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const filePath = `${taskResponse.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, attachment.file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('task-attachments')
              .getPublicUrl(filePath);

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

        // Update task with attachment info
        await supabase
          .from('staff_tasks')
          .update({ attachments: attachmentData })
          .eq('id', taskResponse.id);

        newTaskData.attachments = attachmentData;
      }

      setTasks([newTaskData, ...tasks]);
      setIsCreateTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
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
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
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
        description: "Task status updated successfully.",
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
      const { error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'handover',
          department_id: handoverData.target_department,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, status: 'handover' as const, department_id: handoverData.target_department }
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

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      await addNote(newNote);
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    } finally {
      setAddingNote(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Target },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      handover: { color: 'bg-purple-100 text-purple-800', icon: ArrowRight }
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
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
                <Label htmlFor="assigned_to">Assign To</Label>
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
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
              <div className="grid grid-cols-2 gap-4">
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={uploadingFiles}>
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Management */}
        <div className="lg:col-span-2">
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
                                {task.due_date && format(new Date(task.due_date), 'MMM dd, yyyy')}
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
                    <div key={note.id} className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white/80">{note.content}</p>
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
                  {selectedTask.due_date && (
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>{' '}
                      <span className="font-medium">{format(new Date(selectedTask.due_date), 'MMM dd, yyyy')}</span>
                      {selectedTask.due_time && <span> at {selectedTask.due_time}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Attachments
                  </h4>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{att.title || att.name}</div>
                          <div className="text-xs text-muted-foreground">{att.name} ({(att.size / 1024).toFixed(1)} KB)</div>
                        </div>
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
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    <Input
                      type="date"
                      placeholder="Due Date (optional)"
                      value={newSubtask.due_date}
                      onChange={(e) => setNewSubtask({...newSubtask, due_date: e.target.value})}
                    />
                    <Input
                      type="time"
                      placeholder="Due Time (optional)"
                      value={newSubtask.due_time}
                      onChange={(e) => setNewSubtask({...newSubtask, due_time: e.target.value})}
                    />
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
                              {subtask.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(subtask.due_date), 'MMM dd, yyyy')}
                                  {subtask.due_time && ` at ${subtask.due_time}`}
                                </span>
                              )}
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
    </div>
  );
};

export default TeamHeadWorkspace;