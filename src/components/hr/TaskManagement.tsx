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
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
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
    points: 10
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchStaff();
    fetchProjects();
    fetchClients();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, filterStatus, filterPriority]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_tasks')
        .select(`
          *,
          assigned_to_profile:staff_profiles!assigned_to(id, full_name, username, avatar_url, role),
          assigned_by_profile:staff_profiles!assigned_by(id, full_name, username),
          staff_projects(id, name, status),
          clients(id, company_name, contact_person, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
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

  const handleAddTask = async () => {
    try {
      // Get current user's ID for assigned_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          ...newTask,
          assigned_by: user?.id || crypto.randomUUID(),
          due_date: newTask.due_date || null,
          project_id: newTask.project_id === "no-project" ? null : newTask.project_id,
          client_id: newTask.client_id === "no-client" ? null : newTask.client_id,
          priority: newTask.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: newTask.status as 'pending' | 'in_progress' | 'completed'
        })
        .select('*')
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
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
        points: 10
      });

      toast({
        title: "Success",
        description: "Task created successfully.",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
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
        .select('*')
        .single();

      if (error) throw error;

      setTasks(tasks.map(task => task.id === taskId ? data : task));

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Target },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      handover: { color: 'bg-purple-100 text-purple-800', icon: User },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
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
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} (@{member.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project">Project (Optional)</Label>
                <Select value={newTask.project_id} onValueChange={(value) => setNewTask({...newTask, project_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-project">No Project</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client">Client (Optional)</Label>
                <Select value={newTask.client_id} onValueChange={(value) => setNewTask({...newTask, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-client">No Client</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name} - {client.contact_person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
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
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTask}>
                  Create Task
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
                      onValueChange={(value) => updateTaskStatus(task.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="handover">Handover</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

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

              {/* Comments */}
              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({selectedTask.comments.length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTask.comments.map((comment: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm">{comment.user_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        <p className="text-sm">{comment.content}</p>
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
    </div>
  );
};

export default TaskManagement;