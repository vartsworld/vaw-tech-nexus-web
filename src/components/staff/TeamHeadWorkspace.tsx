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
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffData } from "@/hooks/useStaffData";
import MusicPlayer from "./MusicPlayer";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
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
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
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
    points: 10
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
      setTasks(data || []);
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

  const handleCreateTask = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          ...newTask,
          assigned_by: userId,
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

      setTasks([data, ...tasks]);
      setIsCreateTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        due_date: "",
        points: 10
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
                <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
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
                      <TableHead className="text-white/80">Actions</TableHead>
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
                            {task.due_date && (
                              <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), 'MMM dd, yyyy')}
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
                          <div className="flex gap-2">
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
    </div>
  );
};

export default TeamHeadWorkspace;