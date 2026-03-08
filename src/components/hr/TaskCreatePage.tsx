import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, User, Plus, ChevronDown, Check, Paperclip, X, Loader2, Repeat,
  Flag, Calendar, Target, Layers, FileText, Sparkles
} from "lucide-react";
import CircularDateTimePicker from "./CircularDateTimePicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskCreatePageProps {
  onBack: () => void;
  onCreated: () => void;
  userProfile: any;
}

const TaskCreatePage = ({ onBack, onCreated, userProfile }: TaskCreatePageProps) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { toast } = useToast();

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: [] as string[],
    project_id: "",
    client_id: "",
    department_id: "",
    status: "pending",
    priority: "auto",
    due_date: "",
    due_time: "",
    trial_period: false,
    points: 10,
    attachments: [] as Array<{ file: File; title: string }>,
    is_recurring: false,
    recurrence_type: "weekly",
    recurrence_interval: 1,
    recurrence_end_date: "",
    current_stage: 1,
  });

  const [newClient, setNewClient] = useState({
    company_name: "", contact_person: "", email: "", phone: "", address: "", notes: ""
  });

  useEffect(() => {
    fetchStaff();
    fetchClients();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (newTask.client_id && newTask.client_id !== "no-client") {
      fetchClientProjects(newTask.client_id);
    }
  }, [newTask.client_id]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff_profiles').select('id, user_id, full_name, username, role, avatar_url').order('full_name');
    setStaff(data || []);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, company_name, contact_person').eq('status', 'active').order('company_name');
    setClients(data || []);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name').order('name');
    setDepartments(data || []);
  };

  const fetchClientProjects = async (clientId: string) => {
    const { data } = await supabase.from('client_projects').select('id, title').eq('client_id', clientId).order('title');
    setProjects(data || []);
  };

  const calculateNextRecurrence = (dueDate: string, type: string, interval: number): string => {
    const date = new Date(dueDate);
    switch (type) {
      case 'daily': date.setDate(date.getDate() + interval); break;
      case 'weekly': date.setDate(date.getDate() + (7 * interval)); break;
      case 'monthly': date.setMonth(date.getMonth() + interval); break;
    }
    return date.toISOString().split('T')[0];
  };

  const handleAddClient = async () => {
    if (!newClient.company_name.trim() || !newClient.contact_person.trim() || !newClient.email.trim()) {
      toast({ title: "Validation Error", description: "Company name, contact person, and email are required.", variant: "destructive" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('clients').insert({
        company_name: newClient.company_name.trim(),
        contact_person: newClient.contact_person.trim(),
        email: newClient.email.trim().toLowerCase(),
        phone: newClient.phone.trim() || null,
        address: newClient.address.trim() || null,
        notes: newClient.notes.trim() || null,
        created_by: user.id,
        status: 'active'
      }).select('id, company_name, contact_person').single();
      if (error) throw error;
      setClients([...clients, data]);
      setNewClient({ company_name: "", contact_person: "", email: "", phone: "", address: "", notes: "" });
      setIsAddClientOpen(false);
      setNewTask({ ...newTask, client_id: data.id });
      toast({ title: "Client added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!newTask.title || newTask.assigned_to.length === 0) {
      toast({ title: "Validation Error", description: "Title and at least one assignee are required.", variant: "destructive" });
      return;
    }
    try {
      setUploadingFiles(true);
      const { data: { user } } = await supabase.auth.getUser();

      const taskData: any = {
        title: newTask.title,
        description: newTask.description,
        assigned_to: JSON.stringify(newTask.assigned_to),
        assigned_by: user?.id || crypto.randomUUID(),
        project_id: !newTask.project_id || newTask.project_id === "no-project" ? null : newTask.project_id,
        client_project_id: !newTask.project_id || newTask.project_id === "no-project" ? null : newTask.project_id,
        client_id: !newTask.client_id || newTask.client_id === "no-client" ? null : newTask.client_id,
        priority: newTask.priority === 'auto' ? getEffectivePriority() : newTask.priority,
        status: newTask.status,
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

      const { data: taskResponse, error: taskError } = await supabase.from('staff_tasks').insert(taskData).select('*').single();
      if (taskError) throw taskError;

      // Handle attachments
      if (newTask.attachments.length > 0 && taskResponse.id) {
        for (const attachment of newTask.attachments) {
          const fileExt = attachment.file.name.split('.').pop();
          const filePath = `${taskResponse.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('task-attachments').upload(filePath, attachment.file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(filePath);
          await (supabase.from('task_attachments' as any) as any).insert({
            task_id: taskResponse.id, name: attachment.title || attachment.file.name, url: publicUrl, type: attachment.file.type, size: attachment.file.size
          });
        }
      }

      toast({ title: "Task Created! 🎉", description: `"${newTask.title}" has been assigned successfully.` });
      onCreated();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setUploadingFiles(false);
    }
  };

  const priorityOptions = [
    { value: 'auto', label: 'Auto', color: 'bg-violet-500/10 text-violet-400 border-violet-500/30', icon: '⏱' },
    { value: 'low', label: 'Low', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  ];

  // Auto-priority: update priority based on how close the deadline is
  useEffect(() => {
    if (newTask.priority !== 'auto' || !newTask.due_date) return;
    const now = new Date();
    const due = new Date(newTask.due_date + (newTask.due_time ? `T${newTask.due_time}` : 'T23:59:59'));
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    let computed = 'low';
    if (hoursLeft <= 0) computed = 'urgent';
    else if (hoursLeft <= 24) computed = 'urgent';
    else if (hoursLeft <= 72) computed = 'high';
    else if (hoursLeft <= 168) computed = 'medium'; // 7 days
    // else stays low

    setNewTask(prev => ({ ...prev, _autoPriority: computed }));
  }, [newTask.due_date, newTask.due_time, newTask.priority]);

  const getEffectivePriority = () => {
    if (newTask.priority === 'auto') return (newTask as any)._autoPriority || 'medium';
    return newTask.priority;
  };

  return (
    <div className="space-y-0 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-xl border border-white/10 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Task</h1>
          <p className="text-sm text-muted-foreground">Fill in the details to assign a new task</p>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description Card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] dark:bg-white/[0.06] backdrop-blur-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Task Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g. Implement dark mode theme for task details view"
                className="h-12 text-lg font-semibold bg-transparent border-white/10 focus:border-primary/50 placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe the task goals, requirements, and deliverables..."
                rows={5}
                className="bg-transparent border-white/10 focus:border-primary/50 resize-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Assignment Card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] dark:bg-white/[0.06] backdrop-blur-xl p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Assign To */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Assign To</Label>
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-auto py-1 px-2 text-[10px] text-primary"
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user?.id) setNewTask({ ...newTask, assigned_to: [user.id] });
                    }}
                  >
                    <User className="h-3 w-3 mr-1" /> Assign to myself
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-auto min-h-[44px] py-2 bg-transparent border-white/10 hover:bg-white/5">
                      <div className="flex flex-wrap gap-1.5">
                        {newTask.assigned_to.length > 0 ? (
                          newTask.assigned_to.map((id) => {
                            const member = staff.find(s => s.user_id === id);
                            return (
                              <Badge key={id} className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                {member?.full_name || id}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">Select team members...</span>
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
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                          onClick={() => {
                            const isSelected = newTask.assigned_to.includes(member.user_id);
                            setNewTask({
                              ...newTask,
                              assigned_to: isSelected
                                ? newTask.assigned_to.filter(id => id !== member.user_id)
                                : [...newTask.assigned_to, member.user_id]
                            });
                          }}
                        >
                          <Checkbox checked={newTask.assigned_to.includes(member.user_id)} onCheckedChange={() => {}} />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">{member.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">@{member.username}</span>
                          </div>
                          {newTask.assigned_to.includes(member.user_id) && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Department</Label>
                <Select value={newTask.department_id || "no-department"} onValueChange={(v) => setNewTask({ ...newTask, department_id: v })}>
                  <SelectTrigger className="h-11 bg-transparent border-white/10">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-department">Auto (My Department)</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Client */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-auto py-1 px-2 text-[10px] text-primary" onClick={() => setIsAddClientOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Client
                  </Button>
                </div>
                <Select value={newTask.client_id} onValueChange={(v) => setNewTask({ ...newTask, client_id: v })}>
                  <SelectTrigger className="h-11 bg-transparent border-white/10">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-client">No Client</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Project</Label>
                <Select value={newTask.project_id || "no-project"} onValueChange={(v) => setNewTask({ ...newTask, project_id: v })}>
                  <SelectTrigger className="h-11 bg-transparent border-white/10">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-project">No Project</SelectItem>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Recurring Task Card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] dark:bg-white/[0.06] backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Recurring Task</span>
              </div>
              <Switch checked={newTask.is_recurring} onCheckedChange={(c) => setNewTask({ ...newTask, is_recurring: c })} />
            </div>
            {newTask.is_recurring && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select value={newTask.recurrence_type} onValueChange={(v) => setNewTask({ ...newTask, recurrence_type: v })}>
                    <SelectTrigger className="bg-transparent border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Every</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="1" max="30" value={newTask.recurrence_interval}
                      onChange={(e) => setNewTask({ ...newTask, recurrence_interval: parseInt(e.target.value) || 1 })}
                      className="bg-transparent border-white/10"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {newTask.recurrence_type === 'daily' ? 'day(s)' : newTask.recurrence_type === 'weekly' ? 'week(s)' : 'month(s)'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Input type="date" value={newTask.recurrence_end_date}
                    onChange={(e) => setNewTask({ ...newTask, recurrence_end_date: e.target.value })}
                    className="bg-transparent border-white/10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attachments Card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] dark:bg-white/[0.06] backdrop-blur-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Attachments
            </h3>
            <div className="space-y-3">
              <input type="file" id="file-upload-create" className="hidden" multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files).map(f => ({ file: f, title: f.name }));
                    setNewTask({ ...newTask, attachments: [...newTask.attachments, ...files] });
                  }
                  e.target.value = '';
                }}
              />
              <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload-create')?.click()}
                className="border-dashed border-white/20 bg-transparent hover:bg-white/5 w-full h-20 flex flex-col gap-1"
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to attach files</span>
              </Button>
              {newTask.attachments.length > 0 && (
                <div className="space-y-2">
                  {newTask.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{att.title}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const copy = [...newTask.attachments];
                          copy.splice(idx, 1);
                          setNewTask({ ...newTask, attachments: copy });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Task Config Card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] dark:bg-white/[0.06] backdrop-blur-xl p-6 space-y-5 sticky top-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Task Details</h3>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              {/* Auto option - full width */}
              <button
                onClick={() => setNewTask({ ...newTask, priority: 'auto' })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  newTask.priority === 'auto'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/30 scale-[1.02]'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                ⏱ Auto
                {newTask.priority === 'auto' && newTask.due_date && (
                  <span className="text-[10px] normal-case font-medium opacity-70">
                    → {getEffectivePriority()}
                  </span>
                )}
              </button>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.filter(p => p.value !== 'auto').map(p => (
                  <button
                    key={p.value}
                    onClick={() => setNewTask({ ...newTask, priority: p.value })}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      newTask.priority === p.value
                        ? `${p.color} border-current scale-[1.02]`
                        : 'border-white/10 text-muted-foreground hover:border-white/20'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Points Reward</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min="0" max="1000"
                  value={newTask.points}
                  onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 0 })}
                  className="bg-transparent border-white/10 h-11 text-lg font-bold text-center"
                  disabled={newTask.trial_period}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={newTask.trial_period}
                  onCheckedChange={(c) => setNewTask({ ...newTask, trial_period: c, points: c ? 0 : 10 })}
                />
                <span className="text-xs text-muted-foreground">Trial period (no coins)</span>
              </div>
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Evolution Stage</Label>
              <Input
                type="number" min="1"
                value={newTask.current_stage}
                onChange={(e) => setNewTask({ ...newTask, current_stage: parseInt(e.target.value) || 1 })}
                className="bg-transparent border-white/10 h-11"
              />
            </div>

            {/* Due Date & Time - Creative Circular Picker */}
            <CircularDateTimePicker
              date={newTask.due_date}
              time={newTask.due_time}
              onDateChange={(d) => setNewTask({ ...newTask, due_date: d })}
              onTimeChange={(t) => setNewTask({ ...newTask, due_time: t })}
            />

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <Button onClick={handleSubmit} disabled={uploadingFiles}
                className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20"
              >
                {uploadingFiles ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Create Task</>
                )}
              </Button>
              <Button variant="ghost" onClick={onBack} className="w-full h-10 text-sm text-muted-foreground">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Company Name *</Label><Input value={newClient.company_name} onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })} placeholder="Enter company name" /></div>
            <div><Label>Contact Person *</Label><Input value={newClient.contact_person} onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })} placeholder="Enter contact person" /></div>
            <div><Label>Email *</Label><Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="Enter email" /></div>
            <div><Label>Phone</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Enter phone" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
              <Button onClick={handleAddClient}>Add Client</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskCreatePage;
