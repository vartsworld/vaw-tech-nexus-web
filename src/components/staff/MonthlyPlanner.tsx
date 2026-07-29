import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  Edit,
  Trash2,
  Settings,
  Briefcase,
  Layers,
  Circle,
  Check,
  Target
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isToday,
  parseISO
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface MonthlyPlan {
  id: string;
  date: string;
  title: string;
  description: string;
  created_by: string;
  department_id: string;
  assigned_staff: string[];
  client_id: string | null;
  color: string;
  created_at: string;
  is_completed?: boolean | null;
}

interface MonthlyPlannerProps {
  userId: string;
  userProfile: any;
  filterClientId?: string | null;
}

// Helper to format a Date as YYYY-MM-DD in local time
const getLocalDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format an ISO string date as YYYY-MM-DD in local time
const getIsoDateKey = (isoStr: string) => {
  try {
    const d = parseISO(isoStr);
    return getLocalDateKey(d);
  } catch {
    return '';
  }
};

const MonthlyPlanner = ({ userId, userProfile, filterClientId = null }: MonthlyPlannerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customTagNames, setCustomTagNames] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('vaw_planner_custom_tags') || '{}');
    } catch {
      return {};
    }
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MonthlyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    assigned_staff: [] as string[],
    client_id: 'common',
    color: '#3b82f6'
  });
  const { toast } = useToast();

  // Dynamic color tags with localStorage persistence and backward compatibility migration
  const [colorTags, setColorTags] = useState<{ name: string; value: string }[]>(() => {
    try {
      const saved = localStorage.getItem('vaw_planner_custom_colors');
      if (saved) return JSON.parse(saved);

      const customTags = JSON.parse(localStorage.getItem('vaw_planner_custom_tags') || '{}');
      const defaults = [
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Rose', value: '#f43f5e' },
        { name: 'Violet', value: '#8b5cf6' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Slate', value: '#64748b' }
      ];
      return defaults.map(d => ({
        name: customTags[d.value] || d.name,
        value: d.value
      }));
    } catch {
      return [
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Rose', value: '#f43f5e' },
        { name: 'Violet', value: '#8b5cf6' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Slate', value: '#64748b' }
      ];
    }
  });

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(['all']);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const handleToggleClientFilter = (clientId: string) => {
    if (clientId === 'all') {
      setSelectedClientIds(['all']);
      return;
    }

    let nextSelected = selectedClientIds.filter(id => id !== 'all');

    if (nextSelected.includes(clientId)) {
      nextSelected = nextSelected.filter(id => id !== clientId);
    } else {
      nextSelected.push(clientId);
    }

    if (nextSelected.length === 0) {
      nextSelected = ['all'];
    }

    setSelectedClientIds(nextSelected);
  };

  const handleAddColorTag = () => {
    if (!newTagName.trim() || !newTagColor.trim()) return;
    if (colorTags.some(t => t.value.toLowerCase() === newTagColor.toLowerCase())) {
      toast({
        title: "Error",
        description: "A tag with this color already exists.",
        variant: "destructive"
      });
      return;
    }
    const updated = [...colorTags, { name: newTagName.trim(), value: newTagColor.trim() }];
    setColorTags(updated);
    localStorage.setItem('vaw_planner_custom_colors', JSON.stringify(updated));
    setNewTagName('');
    toast({
      title: "Success",
      description: "New color tag added successfully",
    });
  };

  const handleDeleteColorTag = (colorValue: string) => {
    if (colorTags.length <= 1) {
      toast({
        title: "Error",
        description: "You must keep at least one color tag.",
        variant: "destructive"
      });
      return;
    }
    const updated = colorTags.filter(t => t.value !== colorValue);
    setColorTags(updated);
    localStorage.setItem('vaw_planner_custom_colors', JSON.stringify(updated));
    toast({
      title: "Success",
      description: "Color tag deleted successfully",
    });
  };

  const handleUpdateColorTagName = (colorValue: string, newName: string) => {
    const updated = colorTags.map(t => t.value === colorValue ? { ...t, name: newName } : t);
    setColorTags(updated);
    localStorage.setItem('vaw_planner_custom_colors', JSON.stringify(updated));
  };

  useEffect(() => {
    fetchPlans();
    fetchClients();
    fetchTasksAndSubtasks();
  }, [currentMonth, filterClientId]);

  const fetchTasksAndSubtasks = async () => {
    try {
      // 1. Fetch staff tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // 2. Fetch staff subtasks
      const { data: subtasksData, error: subtasksError } = await supabase
        .from('staff_subtasks')
        .select('*, staff_tasks(*)');

      if (subtasksError) throw subtasksError;

      // Filter tasks according to user assignments and role
      const filteredTasks = (tasksData || []).filter(task => {
        // --- DEPARTMENT SHARING LOGIC ---
        // If the task creator's department is the user's department, show it.
        if (task.department_id && userProfile?.department_id && task.department_id === userProfile.department_id) {
          return true;
        }

        // If the user's department is in the targeted departments of the task
        const stageConfig = task.stage_config ? (typeof task.stage_config === 'string' ? JSON.parse(task.stage_config) : task.stage_config) : {};
        const targetDepts = (stageConfig as any)?.target_departments;
        if (Array.isArray(targetDepts) && userProfile?.department_id && targetDepts.includes(userProfile.department_id)) {
          return true;
        }
        // ---------------------------------

        // Common tasks: no client_id (shown to everyone)
        if (!task.client_id) return true;

        // If user is a team head or has elevated permissions, they can see all
        if (userProfile?.role === 'team_head' || userProfile?.role === 'admin' || userProfile?.is_department_head) {
          return true;
        }

        // Otherwise (client task), show only if assigned
        let isAssignedToTask = false;
        if (task.assigned_to) {
          try {
            const parsed = typeof task.assigned_to === 'string' ? JSON.parse(task.assigned_to) : task.assigned_to;
            isAssignedToTask = Array.isArray(parsed) ? parsed.includes(userId) : parsed === userId;
          } catch {
            isAssignedToTask = String(task.assigned_to).includes(userId);
          }
        }

        // Or assigned to any subtask under this task
        const subtasksOfThisTask = (subtasksData || []).filter((s: any) => s.task_id === task.id);
        const isAssignedToSubtask = subtasksOfThisTask.some((st: any) => st.assigned_to === userId);

        return isAssignedToTask || isAssignedToSubtask;
      });

      // Filter subtasks
      const filteredSubtasks = (subtasksData || []).filter(subtask => {
        const parentTask = subtask.staff_tasks;
        if (!parentTask) return false;

        // --- DEPARTMENT SHARING LOGIC ---
        // If parent task is visible due to creator's department matching user's department
        if (parentTask.department_id && userProfile?.department_id && parentTask.department_id === userProfile.department_id) {
          return true;
        }

        // If parent task is visible due to targeted departments including user's department
        const stageConfig = parentTask.stage_config ? (typeof parentTask.stage_config === 'string' ? JSON.parse(parentTask.stage_config) : parentTask.stage_config) : {};
        const targetDepts = (stageConfig as any)?.target_departments;
        if (Array.isArray(targetDepts) && userProfile?.department_id && targetDepts.includes(userProfile.department_id)) {
          return true;
        }
        // ---------------------------------

        // Common parent task: show to everyone
        if (!parentTask.client_id) return true;

        // Elevated permissions
        if (userProfile?.role === 'team_head' || userProfile?.role === 'admin' || userProfile?.is_department_head) {
          return true;
        }

        // Assigned directly to subtask or to parent task
        let isAssignedToParent = false;
        if (parentTask.assigned_to) {
          try {
            const parsed = typeof parentTask.assigned_to === 'string' ? JSON.parse(parentTask.assigned_to) : parentTask.assigned_to;
            isAssignedToParent = Array.isArray(parsed) ? parsed.includes(userId) : parsed === userId;
          } catch {
            isAssignedToParent = String(parentTask.assigned_to).includes(userId);
          }
        }

        const isAssignedToSubtask = subtask.assigned_to === userId;

        return isAssignedToParent || isAssignedToSubtask;
      });

      setTasks(filteredTasks);
      setSubtasks(filteredSubtasks);
    } catch (err) {
      console.error('Error fetching tasks/subtasks in planner:', err);
    }
  };

  const handleToggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    try {
      const isCompleted = currentStatus === 'completed';
      const nextStatus = isCompleted ? 'in_progress' : 'completed';

      const { error } = await supabase
        .from('staff_tasks')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task marked as ${nextStatus === 'completed' ? 'completed' : 'in progress'}.`,
      });

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    } catch (err: any) {
      console.error('Error toggling task completion:', err);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive"
      });
    }
  };

  const handleToggleSubtaskCompletion = async (subtaskId: string, currentStatus: string) => {
    try {
      const isCompleted = currentStatus === 'completed';
      const nextStatus = isCompleted ? 'in_progress' : 'completed';

      const { error } = await supabase
        .from('staff_subtasks')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', subtaskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subtask marked as ${nextStatus === 'completed' ? 'completed' : 'in progress'}.`,
      });

      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, status: nextStatus } : s));
    } catch (err: any) {
      console.error('Error toggling subtask completion:', err);
      toast({
        title: "Error",
        description: "Failed to update subtask status.",
        variant: "destructive"
      });
    }
  };

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      let query = supabase
        .from('monthly_plans')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      if (filterClientId) {
        query = query.eq('client_id', filterClientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load monthly plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, company_name');
    setClients(data || []);
  };

  const handleAddPlan = async () => {
    if (!selectedDate || !newPlan.title) return;

    try {
      const { data, error } = await supabase
        .from('monthly_plans')
        .insert({
          date: format(selectedDate, 'yyyy-MM-dd'),
          title: newPlan.title,
          description: newPlan.description,
          created_by: userId,
          department_id: userProfile?.department_id,
          assigned_staff: newPlan.assigned_staff,
          client_id: newPlan.client_id === 'common' ? null : newPlan.client_id,
          color: newPlan.color
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan added successfully",
      });

      setPlans([...plans, data]);
      setIsAddDialogOpen(false);
      resetNewPlan();
    } catch (error) {
      console.error('Error adding plan:', error);
      toast({
        title: "Error",
        description: "Failed to add plan",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan || !newPlan.title) return;

    try {
      const { data, error } = await supabase
        .from('monthly_plans')
        .update({
          title: newPlan.title,
          description: newPlan.description,
          assigned_staff: newPlan.assigned_staff,
          client_id: newPlan.client_id === 'common' ? null : newPlan.client_id,
          color: newPlan.color
        })
        .eq('id', selectedPlan.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan updated successfully",
      });

      setPlans(plans.map(p => p.id === selectedPlan.id ? data : p));
      setIsAddDialogOpen(false);
      setSelectedPlan(null);
      resetNewPlan();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  const handleTogglePlanCompletion = async (planId: string, currentCompleted: boolean | null) => {
    try {
      const { error } = await supabase
        .from('monthly_plans')
        .update({ is_completed: !currentCompleted })
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev =>
        prev.map(p => p.id === planId ? { ...p, is_completed: !currentCompleted } : p)
      );
      toast({
        title: "Success",
        description: "Plan completion updated successfully",
      });
    } catch (err) {
      console.error('Error updating plan:', err);
      toast({
        title: "Error",
        description: "Failed to update plan status",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monthly_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });

      setPlans(plans.filter(p => p.id !== id));
      // If we deleted from Day Detail, we stay there, if it was the last plan it might need handling
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  const resetNewPlan = () => {
    setNewPlan({
      title: '',
      description: '',
      assigned_staff: [],
      client_id: 'common',
      color: '#3b82f6'
    });
    setSelectedPlan(null);
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/50 border-b border-white/5">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-black font-black text-xs uppercase tracking-wider"
            onClick={() => {
              setSelectedDate(new Date());
              resetNewPlan();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> New Plan
          </Button>
        </div>
      </div>
    );
  };

  // Memoize filtered lists based on active filters to avoid array filtering on every render
  const { filteredPlans, filteredTasks, filteredSubtasks } = useMemo(() => {
    if (selectedClientIds.includes('all')) {
      return {
        filteredPlans: plans,
        filteredTasks: tasks,
        filteredSubtasks: subtasks
      };
    }

    const filteredPlansList = plans.filter(p => {
      if (!p.client_id) return selectedClientIds.includes('common');
      return selectedClientIds.includes(p.client_id);
    });

    const filteredTasksList = tasks.filter(t => {
      if (!t.client_id) return selectedClientIds.includes('common');
      return selectedClientIds.includes(t.client_id);
    });

    const filteredSubtasksList = subtasks.filter(s => {
      const parentTask = s.staff_tasks;
      if (!parentTask) return false;
      if (!parentTask.client_id) return selectedClientIds.includes('common');
      return selectedClientIds.includes(parentTask.client_id);
    });

    return {
      filteredPlans: filteredPlansList,
      filteredTasks: filteredTasksList,
      filteredSubtasks: filteredSubtasksList
    };
  }, [plans, tasks, subtasks, selectedClientIds]);


  // Precompute grouped items by local date key YYYY-MM-DD for O(1) rendering lookup
  const { plansByDate, tasksByDate, subtasksByDate } = useMemo(() => {
    const plansMap: Record<string, MonthlyPlan[]> = {};
    const tasksMap: Record<string, any[]> = {};
    const subtasksMap: Record<string, any[]> = {};

    filteredPlans.forEach(p => {
      if (!p.date) return;
      const key = getIsoDateKey(p.date);
      if (key) {
        if (!plansMap[key]) plansMap[key] = [];
        plansMap[key].push(p);
      }
    });

    filteredTasks.forEach(t => {
      if (!t.due_date) return;
      const key = getIsoDateKey(t.due_date);
      if (key) {
        if (!tasksMap[key]) tasksMap[key] = [];
        tasksMap[key].push(t);
      }
    });

    filteredSubtasks.forEach(s => {
      if (!s.due_date) return;
      const key = getIsoDateKey(s.due_date);
      if (key) {
        if (!subtasksMap[key]) subtasksMap[key] = [];
        subtasksMap[key].push(s);
      }
    });

    return {
      plansByDate: plansMap,
      tasksByDate: tasksMap,
      subtasksByDate: subtasksMap,
    };
  }, [filteredPlans, filteredTasks, filteredSubtasks]);

  // Group plans for the detailed view
  const getGroupedPlans = (datePlans: MonthlyPlan[]) => {
    const common = datePlans.filter(p => !p.client_id);
    const clientGrouped: Record<string, { name: string, plans: MonthlyPlan[] }> = {};

    datePlans.filter(p => p.client_id).forEach(p => {
      const client = clients.find(c => c.id === p.client_id);
      const name = client?.company_name || 'Unknown Client';
      if (!clientGrouped[p.client_id!]) {
        clientGrouped[p.client_id!] = { name, plans: [] };
      }
      clientGrouped[p.client_id!].plans.push(p);
    });

    return { common, clientGrouped };
  };

  const selectedDateKey = selectedDate ? getLocalDateKey(selectedDate) : '';
  const selectedDayPlans = selectedDateKey ? plansByDate[selectedDateKey] || [] : [];
  const selectedDayTasks = selectedDateKey ? tasksByDate[selectedDateKey] || [] : [];
  const selectedDaySubtasks = selectedDateKey ? subtasksByDate[selectedDateKey] || [] : [];
  const { common: commonPlans, clientGrouped } = getGroupedPlans(selectedDayPlans);

  return (
    <Card className="w-full shadow-2xl border-white/5 bg-zinc-950/40 backdrop-blur-xl overflow-hidden rounded-3xl">
      <CardHeader className="p-0">
        {renderHeader()}
      </CardHeader>

      {/* Dynamic Sorter/Filter Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 text-xs font-bold uppercase"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Filter Clients ({selectedClientIds.includes('all') ? 'All' : selectedClientIds.length})</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-zinc-950 border border-white/10 rounded-2xl p-3 shadow-2xl space-y-2 z-50">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white/40 px-2 pb-1 border-b border-white/5">
                Filter by Client
              </h4>
              <ScrollArea className="h-48 pr-1">
                <div className="space-y-1">
                  {/* All Option */}
                  <button
                    onClick={() => handleToggleClientFilter('all')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <Checkbox
                      checked={selectedClientIds.includes('all')}
                      onCheckedChange={() => handleToggleClientFilter('all')}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <span className="text-xs font-bold text-white uppercase">All Clients</span>
                  </button>

                  {/* Common / No Client Option */}
                  <button
                    onClick={() => handleToggleClientFilter('common')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <Checkbox
                      checked={selectedClientIds.includes('common')}
                      onCheckedChange={() => handleToggleClientFilter('common')}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <span className="text-xs font-bold text-white/70 uppercase">Common (No Client)</span>
                  </button>

                  {/* Client Options */}
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleToggleClientFilter(client.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <Checkbox
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => handleToggleClientFilter(client.id)}
                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                      />
                      <span className="text-xs font-medium text-white/90 truncate">{client.company_name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        <div className="text-[10px] uppercase font-black tracking-widest text-white/35 flex items-center gap-2">
          <span>Active Filter:</span>
          <span className="text-primary">
            {selectedClientIds.includes('all') ? 'All Clients' : `${selectedClientIds.length} Selected`}
          </span>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-4xl bg-zinc-900/40 border border-white/5 rounded-3xl p-3 sm:p-6 backdrop-blur-md">
          <ShadcnCalendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate || undefined}
            onSelect={setSelectedDate}
            onDayClick={(date) => {
              setSelectedDate(date);
              setIsDayDetailOpen(true);
            }}
            className="w-full p-0 bg-transparent text-white"
            classNames={{
              months: "w-full space-y-4",
              month: "space-y-4 w-full",
              caption: "hidden",
              table: "w-full border-collapse space-y-1",
              head_row: "grid grid-cols-7 w-full border-b border-white/5 pb-2",
              head_cell: "text-zinc-500 rounded-md font-bold text-center text-xs uppercase tracking-wider py-2",
              row: "grid grid-cols-7 w-full mt-2",
              cell: "aspect-square w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
              day: "h-full w-full p-0 font-bold text-white hover:bg-white/10 rounded-2xl flex flex-col items-center justify-center transition-all border border-transparent aria-selected:border-2 aria-selected:border-primary aria-selected:bg-transparent aria-selected:text-primary",
              day_today: "border-primary/50 text-primary bg-primary/5 hover:bg-primary/20",
              day_selected: "border-2 border-primary text-primary hover:bg-white/10 hover:text-primary focus:bg-transparent focus:text-primary rounded-2xl bg-transparent font-black",
              day_outside: "text-zinc-600 opacity-30",
            }}
            components={{
              DayContent: ({ date }) => {
                const dateKey = getLocalDateKey(date);
                const dayPlans = plansByDate[dateKey] || [];
                const dayTasks = tasksByDate[dateKey] || [];
                const daySubtasks = subtasksByDate[dateKey] || [];

                const totalCount = dayPlans.length + dayTasks.length + daySubtasks.length;
                const hasItems = totalCount > 0;
                const allCompleted = hasItems &&
                  dayPlans.every(p => p.is_completed) &&
                  dayTasks.every(t => t.status === 'completed') &&
                  daySubtasks.every(s => s.status === 'completed');

                return (
                  <div className={cn(
                    "relative flex flex-col items-center justify-center w-full h-full p-2 rounded-2xl transition-all",
                    allCompleted && "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  )}>
                    <span className={cn(
                      "text-sm sm:text-base",
                      allCompleted && "font-black"
                    )}>{date.getDate()}</span>

                    {allCompleted && (
                      <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-emerald-500 text-black rounded-full p-0.5 shadow-md flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                      </div>
                    )}

                    {totalCount > 0 && (
                      <div className="absolute bottom-2 flex gap-1 justify-center w-full px-1 overflow-hidden">
                        {[
                          ...dayPlans.map(p => p.color || '#3b82f6'),
                          ...dayTasks.map(() => '#8b5cf6'),
                          ...daySubtasks.map(() => '#ec4899')
                        ].slice(0, 3).map((color, idx) => (
                          <span
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        {totalCount > 3 && (
                          <span className="w-1 h-1 rounded-full bg-white opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </div>
      </CardContent>

      {/* ═══════════════════════════════════════════════════
          DAY DETAIL DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
        <DialogContent className="sm:max-w-2xl bg-zinc-950 border-white/10 rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-primary/10 via-transparent to-transparent shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic text-white tracking-tighter">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Day Details'}
                </DialogTitle>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
                  Daily Strategic Objectives & Task Groups
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsDayDetailOpen(false);
                  resetNewPlan();
                  setIsAddDialogOpen(true);
                }}
                className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase h-10 px-4"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Plan
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Common Tasks */}
              {commonPlans.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Common Plans</h4>
                  </div>
                  <div className="grid gap-3">
                    {commonPlans.map(plan => (
                      <PlanItem
                        key={plan.id}
                        plan={plan}
                        onEdit={(p) => {
                          setSelectedPlan(p);
                          setNewPlan({
                            title: p.title,
                            description: p.description,
                            assigned_staff: p.assigned_staff,
                            client_id: 'common',
                            color: p.color
                          });
                          setIsAddDialogOpen(true);
                        }}
                        onDelete={handleDeletePlan}
                        onToggleComplete={handleTogglePlanCompletion}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Client Tasks Grouped */}
              {Object.entries(clientGrouped).map(([clientId, group]) => (
                <div key={clientId} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{group.name}</h4>
                  </div>
                  <div className="grid gap-3">
                    {group.plans.map(plan => (
                      <PlanItem
                        key={plan.id}
                        plan={plan}
                        onEdit={(p) => {
                          setSelectedPlan(p);
                          setNewPlan({
                            title: p.title,
                            description: p.description,
                            assigned_staff: p.assigned_staff,
                            client_id: p.client_id || 'common',
                            color: p.color
                          });
                          setIsAddDialogOpen(true);
                        }}
                        onDelete={handleDeletePlan}
                        onToggleComplete={handleTogglePlanCompletion}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Tasks Due Today */}
              {selectedDayTasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Tasks Due</h4>
                  </div>
                  <div className="grid gap-3">
                    {selectedDayTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          "p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group relative overflow-hidden flex justify-between items-center gap-4",
                          task.status === 'completed' && "opacity-50"
                        )}
                        style={{ borderLeft: `4px solid #8b5cf6` }}
                      >
                        <div className="flex-1 min-w-0">
                          <h5
                            className={cn(
                              "font-black text-sm uppercase italic tracking-tight text-white",
                              task.status === 'completed' && "line-through text-zinc-500"
                            )}
                            style={task.status === 'completed' ? {} : { color: '#8b5cf6' }}
                          >
                            {task.title}
                          </h5>
                          <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed font-medium mt-1">
                            {task.description || 'No directives or descriptions provided.'}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-[9px] text-white/25 font-bold uppercase tracking-wider">
                            <span>Points: {task.points}</span>
                            {task.client_id && <span className="text-blue-400">Client Task</span>}
                            <span>Status: {task.status}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleTaskCompletion(task.id, task.status)}
                          className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0",
                            task.status === 'completed'
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "border-white/10 text-zinc-500 hover:border-white/20"
                          )}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks Due Today */}
              {selectedDaySubtasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pink-400" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Subtasks Due</h4>
                  </div>
                  <div className="grid gap-3">
                    {selectedDaySubtasks.map(sub => (
                      <div
                        key={sub.id}
                        className={cn(
                          "p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group relative overflow-hidden flex justify-between items-center gap-4",
                          sub.status === 'completed' && "opacity-50"
                        )}
                        style={{ borderLeft: `4px solid #ec4899` }}
                      >
                        <div className="flex-1 min-w-0">
                          <h5
                            className={cn(
                              "font-black text-sm uppercase italic tracking-tight text-white",
                              sub.status === 'completed' && "line-through text-zinc-500"
                            )}
                            style={sub.status === 'completed' ? {} : { color: '#ec4899' }}
                          >
                            {sub.title}
                          </h5>
                          <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed font-medium mt-1">
                            {sub.description || 'No directives or descriptions provided.'}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-[9px] text-white/25 font-bold uppercase tracking-wider">
                            <span>Points: {sub.points}</span>
                            {sub.staff_tasks?.title && <span className="text-zinc-400">Parent: {sub.staff_tasks.title}</span>}
                            <span>Status: {sub.status}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleSubtaskCompletion(sub.id, sub.status)}
                          className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0",
                            sub.status === 'completed'
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "border-white/10 text-zinc-500 hover:border-white/20"
                          )}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDayPlans.length === 0 && selectedDayTasks.length === 0 && selectedDaySubtasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-white font-bold uppercase text-sm tracking-widest">No plans or tasks for today</h3>
                  <p className="text-white/30 text-[10px] uppercase font-black mt-2">Initialize your daily targets to stay on track</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          ADD / EDIT PLAN DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-white/10 rounded-3xl p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-black uppercase italic text-white tracking-tighter">
              {selectedPlan ? 'Edit Strategic Plan' : 'Define New Strategy'}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
              {selectedDate ? format(selectedDate, 'PPP') : ''}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Plan Title</Label>
                <Input
                  placeholder="e.g., Q4 Marketing Review"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Category / Client</Label>
                  <Select
                    value={newPlan.client_id}
                    onValueChange={(val) => setNewPlan({ ...newPlan, client_id: val })}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="common">Common Plan</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Color Tag</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {colorTags.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewPlan({ ...newPlan, color: c.value })}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all hover:scale-125 border-2",
                          newPlan.color === c.value ? "border-white scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Description & Directives</Label>
                <Textarea
                  placeholder="Detail the core objectives and expected outcomes..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="min-h-[120px] bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsAddDialogOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold text-xs uppercase text-white/40 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={selectedPlan ? handleUpdatePlan : handleAddPlan}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-black rounded-xl font-black text-xs uppercase tracking-wider"
            >
              {selectedPlan ? 'Update Strategy' : 'Save Strategy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          PLANNER SETTINGS DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] shrink-0">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white">Planner Settings</DialogTitle>
            <DialogDescription className="text-white/40 uppercase text-[10px] font-bold tracking-widest mt-1">
              Manage color tags & customize environment
            </DialogDescription>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Existing Tags */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/80">Tag Legend & Renaming</h4>
                <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider leading-none">
                  Click text to rename or trash icon to delete tags
                </p>
                <div className="grid gap-2">
                  {colorTags.map(c => (
                    <div key={c.value} className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.value }} />
                        <input
                          type="text"
                          className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs font-bold text-white uppercase p-0 w-full"
                          value={c.name}
                          onChange={(e) => handleUpdateColorTagName(c.value, e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-red-500/40 hover:text-red-500 hover:bg-white/5 shrink-0"
                        onClick={() => handleDeleteColorTag(c.value)}
                        title="Delete tag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Tag */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/80">Add New Tag</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Tag Name</Label>
                    <Input
                      placeholder="e.g., Critical"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="h-9 bg-white/5 border-white/10 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Tag Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-12 h-9 p-1 bg-white/5 border-white/10 rounded-lg cursor-pointer shrink-0"
                      />
                      <Input
                        type="text"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        placeholder="#ffffff"
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleAddColorTag}
                  className="w-full h-9 bg-primary hover:bg-primary/90 text-black font-bold text-xs uppercase rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Color Tag
                </Button>
              </div>
            </div>
          </ScrollArea>
          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <Button onClick={() => setIsSettingsOpen(false)} className="w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold uppercase text-xs h-11 text-white">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

interface PlanItemProps {
  plan: MonthlyPlan;
  onEdit: (p: MonthlyPlan) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, currentCompleted: boolean | null) => void;
}

const PlanItem = ({ plan, onEdit, onDelete, onToggleComplete }: PlanItemProps) => {
  return (
    <div
      className={cn(
        "p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group relative overflow-hidden flex justify-between items-center gap-4",
        plan.is_completed && "opacity-50"
      )}
      style={{ borderLeft: `4px solid ${plan.color}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <h5
            className={cn(
              "font-black text-sm uppercase italic tracking-tight text-white",
              plan.is_completed && "line-through text-zinc-500"
            )}
            style={plan.is_completed ? {} : { color: plan.color || '#ffffff' }}
          >
            {plan.title}
          </h5>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-white/40 hover:text-white"
              onClick={() => onEdit(plan)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-red-500/40 hover:text-red-500"
              onClick={() => onDelete(plan.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed font-medium">
          {plan.description || 'No directives provided.'}
        </p>
        {plan.assigned_staff.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <User className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              {plan.assigned_staff.length} Members Assigned
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => onToggleComplete(plan.id, plan.is_completed || false)}
        className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0",
          plan.is_completed
            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
            : "border-white/10 text-zinc-500 hover:border-white/20"
        )}
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
};

export default MonthlyPlanner;
