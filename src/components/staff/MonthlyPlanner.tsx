import React, { useState, useEffect, useMemo } from 'react';
import { Scheduler } from 'calendarkit-pro';
import type { CalendarEvent, ViewType } from 'calendarkit-pro';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Check,
  Target,
  Grid,
  List,
  Sparkles
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDayTasksDialogOpen, setIsDayTasksDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedPlan, setSelectedPlan] = useState<MonthlyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const lastDateClickRef = React.useRef<number>(0);

  const handleDateChange = (newDate: Date) => {
    lastDateClickRef.current = Date.now();
    setCurrentMonth(newDate);
    setSelectedDate(newDate);
    if (view === 'month') {
      setIsDayTasksDialogOpen(true);
    }
  };

  const handleViewChange = (newView: ViewType) => {
    // If currently in 'month' view and an automated date cell click tries to switch view to 'day' within 150ms, keep it in 'month' view!
    if (view === 'month' && newView === 'day' && Date.now() - lastDateClickRef.current < 150) {
      return;
    }
    setView(newView);
  };

  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    assigned_staff: [] as string[],
    client_id: 'common',
    color: '#3b82f6'
  });
  const { toast } = useToast();

  // Dynamic color tags with localStorage persistence
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
    fetchStaffMembers();
    fetchTasksAndSubtasks();
  }, [currentMonth, filterClientId]);

  const fetchStaffMembers = async () => {
    const { data } = await supabase.from('staff_profiles').select('id, user_id, full_name, email');
    setStaffMembers(data || []);
  };

  const fetchTasksAndSubtasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('*');

      if (tasksError) throw tasksError;

      const { data: subtasksData, error: subtasksError } = await supabase
        .from('staff_subtasks')
        .select('*, staff_tasks(*)');

      if (subtasksError) throw subtasksError;

      const filteredTasks = (tasksData || []).filter(task => {
        if (task.department_id && userProfile?.department_id && task.department_id === userProfile.department_id) {
          return true;
        }

        const stageConfig = task.stage_config ? (typeof task.stage_config === 'string' ? JSON.parse(task.stage_config) : task.stage_config) : {};
        const targetDepts = (stageConfig as any)?.target_departments;
        if (Array.isArray(targetDepts) && userProfile?.department_id && targetDepts.includes(userProfile.department_id)) {
          return true;
        }

        if (!task.client_id) return true;

        if (userProfile?.role === 'team_head' || userProfile?.role === 'admin' || userProfile?.is_department_head) {
          return true;
        }

        let isAssignedToTask = false;
        if (task.assigned_to) {
          try {
            const parsed = typeof task.assigned_to === 'string' ? JSON.parse(task.assigned_to) : task.assigned_to;
            isAssignedToTask = Array.isArray(parsed) ? parsed.includes(userId) : parsed === userId;
          } catch {
            isAssignedToTask = String(task.assigned_to).includes(userId);
          }
        }

        const subtasksOfThisTask = (subtasksData || []).filter((s: any) => s.task_id === task.id);
        const isAssignedToSubtask = subtasksOfThisTask.some((st: any) => st.assigned_to === userId);

        return isAssignedToTask || isAssignedToSubtask;
      });

      const filteredSubtasks = (subtasksData || []).filter(subtask => {
        const parentTask = subtask.staff_tasks;
        if (!parentTask) return false;

        if (parentTask.department_id && userProfile?.department_id && parentTask.department_id === userProfile.department_id) {
          return true;
        }

        const stageConfig = parentTask.stage_config ? (typeof parentTask.stage_config === 'string' ? JSON.parse(parentTask.stage_config) : parentTask.stage_config) : {};
        const targetDepts = (stageConfig as any)?.target_departments;
        if (Array.isArray(targetDepts) && userProfile?.department_id && targetDepts.includes(userProfile.department_id)) {
          return true;
        }

        if (!parentTask.client_id) return true;

        if (userProfile?.role === 'team_head' || userProfile?.role === 'admin' || userProfile?.is_department_head) {
          return true;
        }

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
      setPlans((data || []).map((item: any) => ({
        ...item,
        assigned_staff: Array.isArray(item.assigned_staff) ? item.assigned_staff : []
      })));
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

      const formattedPlan: MonthlyPlan = {
        ...(data as any),
        assigned_staff: Array.isArray(data.assigned_staff) ? (data.assigned_staff as string[]) : []
      };
      setPlans([...plans, formattedPlan]);
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

      const formattedPlan: MonthlyPlan = {
        ...(data as any),
        assigned_staff: Array.isArray(data.assigned_staff) ? (data.assigned_staff as string[]) : []
      };
      setPlans(plans.map(p => p.id === selectedPlan.id ? formattedPlan : p));
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

  // Memoize filtered lists based on active filters
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

  // Precompute grouped items by local date key YYYY-MM-DD for day lookup
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

  // Convert monthly plans, staff tasks, and subtasks into CalendarKit Pro CalendarEvents
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    const getClientName = (cId: string | null | undefined) => {
      if (!cId || cId === 'common') return 'Common (No Client)';
      const found = clients.find(c => c.id === cId);
      return found ? found.company_name : 'Client';
    };

    // 1. Monthly Plans
    filteredPlans.forEach(plan => {
      if (!plan.date) return;
      const startDate = new Date(`${plan.date}T09:00:00`);
      const endDate = new Date(`${plan.date}T17:00:00`);
      const clientName = getClientName(plan.client_id);
      events.push({
        id: plan.id,
        title: plan.title,
        start: startDate,
        end: endDate,
        description: plan.description || '',
        color: plan.color || '#3b82f6',
        allDay: true,
        calendarId: 'plan',
        resourceId: plan.client_id || 'common',
        type: 'plan',
        rawPlan: plan,
        guests: [clientName],
      });
    });

    // 2. Staff Tasks
    filteredTasks.forEach(task => {
      if (!task.due_date) return;
      const dateKey = getIsoDateKey(task.due_date);
      if (!dateKey) return;
      const startDate = new Date(`${dateKey}T10:00:00`);
      const endDate = new Date(`${dateKey}T12:00:00`);
      const clientName = getClientName(task.client_id);
      events.push({
        id: `task-${task.id}`,
        title: `⚡ ${task.title}`,
        start: startDate,
        end: endDate,
        description: task.description || '',
        color: '#8b5cf6',
        allDay: true,
        calendarId: 'task',
        resourceId: task.client_id || 'common',
        type: 'task',
        rawTask: task,
        guests: [clientName],
      });
    });

    // 3. Subtasks
    filteredSubtasks.forEach(sub => {
      if (!sub.due_date) return;
      const dateKey = getIsoDateKey(sub.due_date);
      if (!dateKey) return;
      const startDate = new Date(`${dateKey}T14:00:00`);
      const endDate = new Date(`${dateKey}T16:00:00`);
      const clientName = getClientName(sub.staff_tasks?.client_id);
      events.push({
        id: `subtask-${sub.id}`,
        title: `📌 ${sub.title}`,
        start: startDate,
        end: endDate,
        description: sub.description || '',
        color: '#ec4899',
        allDay: true,
        calendarId: 'subtask',
        resourceId: sub.staff_tasks?.client_id || 'common',
        type: 'subtask',
        rawSubtask: sub,
        guests: [clientName],
      });
    });

    return events;
  }, [filteredPlans, filteredTasks, filteredSubtasks, clients]);

  const handleEventDrop = async (event: CalendarEvent, start: Date) => {
    if (event.type === 'plan' && event.rawPlan) {
      const newDateStr = format(start, 'yyyy-MM-dd');
      try {
        const { error } = await supabase
          .from('monthly_plans')
          .update({ date: newDateStr })
          .eq('id', event.rawPlan.id);

        if (error) throw error;

        toast({
          title: "Plan Rescheduled",
          description: `Moved "${event.title}" to ${format(start, 'PPP')}`,
        });

        setPlans(prev => prev.map(p => p.id === event.rawPlan.id ? { ...p, date: newDateStr } : p));
      } catch (err) {
        console.error('Error updating plan date on drop:', err);
        toast({
          title: "Error",
          description: "Failed to reschedule plan date",
          variant: "destructive"
        });
      }
    }
  };

  const SchedulerAny = Scheduler as any;

  return (
    <div className="w-full text-white calendar-kit-dark-container">
      <SchedulerAny
        events={calendarEvents}
        view={view}
        onViewChange={handleViewChange}
        date={currentMonth}
        onDateChange={handleDateChange}
        maxEventsPerDay={100}
        translations={{
          guests: "Assigned Staff",
          whosJoining: "Assign Staff",
          resource: "Client",
          selectResource: "Choose Client"
        }}
        guests={staffMembers.map(s => ({
          id: s.user_id || s.id,
          name: s.full_name || s.email || 'Staff Member',
          email: s.email || `${(s.full_name || 'staff').toLowerCase().replace(/\s+/g, '')}@vaw.com`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.full_name || 'staff')}`
        }))}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventDrop}
        onEventCreate={async (eventData: any) => {
          try {
            const eventDate = eventData.start ? new Date(eventData.start) : (selectedDate || new Date());
            const assignedStaff = Array.isArray(eventData.guests)
              ? eventData.guests.map((g: any) => typeof g === 'string' ? g : (g.id || g.user_id))
              : [];

            const { error } = await supabase
              .from('monthly_plans')
              .insert({
                date: format(eventDate, 'yyyy-MM-dd'),
                title: eventData.title || 'New Task',
                description: eventData.description || '',
                created_by: userId,
                department_id: userProfile?.department_id,
                assigned_staff: assignedStaff,
                client_id: eventData.resourceId && eventData.resourceId !== 'common' ? eventData.resourceId : null,
                color: eventData.color || '#3b82f6'
              });

            if (error) throw error;
            toast({
              title: "Success",
              description: "Task created successfully",
            });
            fetchPlans();
          } catch (err: any) {
            console.error('Error creating task from calendar popup:', err);
            toast({
              title: "Error",
              description: "Failed to create task",
              variant: "destructive"
            });
          }
        }}
        onEventUpdate={async (eventData: any) => {
          if (eventData.rawPlan) {
            try {
              const assignedStaff = Array.isArray(eventData.guests)
                ? eventData.guests.map((g: any) => typeof g === 'string' ? g : (g.id || g.user_id))
                : undefined;

              const { error } = await supabase
                .from('monthly_plans')
                .update({
                  title: eventData.title,
                  description: eventData.description,
                  ...(assignedStaff ? { assigned_staff: assignedStaff } : {}),
                  client_id: eventData.resourceId && eventData.resourceId !== 'common' ? eventData.resourceId : null,
                  color: eventData.color
                })
                .eq('id', eventData.rawPlan.id);

              if (error) throw error;
              toast({ title: "Updated", description: "Plan updated successfully" });
              fetchPlans();
            } catch (err) {
              console.error('Error updating plan:', err);
            }
          }
        }}
        onEventDelete={(eventId) => {
          const targetPlan = plans.find(p => p.id === eventId);
          if (targetPlan) {
            handleDeletePlan(targetPlan.id);
          }
        }}
        isDarkMode={true}
        resources={clients.map(c => ({ id: c.id, label: c.company_name, color: '#3b82f6' }))}
        calendars={[
          { id: 'plan', label: 'Monthly Plans', color: '#3b82f6', active: true },
          { id: 'task', label: 'Staff Tasks', color: '#8b5cf6', active: true },
          { id: 'subtask', label: 'Subtasks', color: '#ec4899', active: true }
        ]}
        className="w-full rounded-3xl bg-zinc-950/80 border border-white/10 text-white shadow-2xl overflow-hidden"
      />

      {/* ═══════════════════════════════════════════════════
          DATE TASKS POPUP DIALOG (Month view date cell click)
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isDayTasksDialogOpen} onOpenChange={setIsDayTasksDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-zinc-950 border-white/10 text-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                {selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}
              </DialogTitle>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs font-bold">
                {(() => {
                  const dateKey = selectedDate ? getLocalDateKey(selectedDate) : '';
                  const dayPlans = plansByDate[dateKey] || [];
                  const dayTasks = tasksByDate[dateKey] || [];
                  const daySubtasks = subtasksByDate[dateKey] || [];
                  const count = dayPlans.length + dayTasks.length + daySubtasks.length;
                  return `${count} ${count === 1 ? 'Item' : 'Items'}`;
                })()}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[140px] max-h-[50vh] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {(() => {
              const dateKey = selectedDate ? getLocalDateKey(selectedDate) : '';
              const dayPlans = plansByDate[dateKey] || [];
              const dayTasks = tasksByDate[dateKey] || [];
              const daySubtasks = subtasksByDate[dateKey] || [];
              const totalCount = dayPlans.length + dayTasks.length + daySubtasks.length;

              if (totalCount === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <CalendarIcon className="w-8 h-8 text-white/20 mb-2" />
                    <p className="text-xs font-bold text-white/60 uppercase">No plans scheduled for this date</p>
                    <p className="text-[10px] text-white/30 mt-1">Initialize your daily targets or add a new plan.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 pb-2">
                  {dayPlans.map(p => {
                    const cObj = clients.find(c => c.id === p.client_id);
                    const cName = cObj ? cObj.company_name : 'Common (Internal)';
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setIsDayTasksDialogOpen(false);
                          setSelectedPlan(p);
                          setNewPlan({
                            title: p.title,
                            description: p.description,
                            assigned_staff: p.assigned_staff || [],
                            client_id: p.client_id || 'common',
                            color: p.color || '#3b82f6'
                          });
                          setIsAddDialogOpen(true);
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-all space-y-1.5 group relative"
                        style={{ borderLeft: `4px solid ${p.color || '#3b82f6'}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                            {p.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/15 text-blue-300 font-bold text-[10px] uppercase tracking-wider">{cName}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDayTasksDialogOpen(false);
                                setSelectedPlan(p);
                                setNewPlan({
                                  title: p.title,
                                  description: p.description,
                                  assigned_staff: p.assigned_staff || [],
                                  client_id: p.client_id || 'common',
                                  color: p.color || '#3b82f6'
                                });
                                setIsAddDialogOpen(true);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </Button>
                          </div>
                        </div>
                        {p.description && <p className="text-xs text-white/60 line-clamp-2">{p.description}</p>}
                      </div>
                    );
                  })}

                  {dayTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTaskCompletion(t.id, t.status)}
                      className="p-3 rounded-2xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/20 cursor-pointer transition-all space-y-1.5 group"
                      style={{ borderLeft: `4px solid #8b5cf6` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-purple-200 group-hover:text-purple-100 transition-colors flex items-center gap-1.5">
                          ⚡ {t.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/15 text-purple-300 font-bold text-[10px] uppercase tracking-wider">Task</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-lg flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaskCompletion(t.id, t.status);
                            }}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            {t.status === 'completed' ? 'Pending' : 'Complete'}
                          </Button>
                        </div>
                      </div>
                      {t.description && <p className="text-xs text-white/60 line-clamp-2">{t.description}</p>}
                    </div>
                  ))}

                  {daySubtasks.map(st => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtaskCompletion(st.id, st.status)}
                      className="p-3 rounded-2xl bg-pink-950/20 hover:bg-pink-900/30 border border-pink-500/20 cursor-pointer transition-all space-y-1.5 group"
                      style={{ borderLeft: `4px solid #ec4899` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-pink-200 group-hover:text-pink-100 transition-colors flex items-center gap-1.5">
                          📌 {st.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="border-pink-500/40 bg-pink-500/15 text-pink-300 font-bold text-[10px] uppercase tracking-wider">Subtask</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs font-bold text-pink-300 hover:text-white hover:bg-pink-500/20 rounded-lg flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSubtaskCompletion(st.id, st.status);
                            }}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            {st.status === 'completed' ? 'Pending' : 'Complete'}
                          </Button>
                        </div>
                      </div>
                      {st.description && <p className="text-xs text-white/60 line-clamp-2">{st.description}</p>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex gap-2 pt-3 border-t border-white/5 shrink-0">
            <Button
              className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg"
              onClick={() => {
                setIsDayTasksDialogOpen(false);
                resetNewPlan();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Plan For Date
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold rounded-xl"
              onClick={() => setIsDayTasksDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* ═══════════════════════════════════════════════════
          ADD / EDIT PLAN DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
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
                  className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Category / Client</Label>
                  <Select
                    value={newPlan.client_id}
                    onValueChange={(val) => setNewPlan({ ...newPlan, client_id: val })}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
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
                        aria-label={`Select color ${c.name}`}
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
                  className="min-h-[120px] bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-medium leading-relaxed text-white"
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
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
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
                        aria-label="Delete tag"
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
                      className="h-9 bg-white/5 border-white/10 rounded-lg text-xs font-bold text-white"
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
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs font-mono uppercase text-white"
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
    </div>
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
              aria-label="Edit plan"
              title="Edit plan"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-red-500/40 hover:text-red-500"
              onClick={() => onDelete(plan.id)}
              aria-label="Delete plan"
              title="Delete plan"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed font-medium">
          {plan.description || 'No directives provided.'}
        </p>
        {plan.assigned_staff && plan.assigned_staff.length > 0 && (
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
        aria-label={plan.is_completed ? "Mark plan as pending" : "Mark plan as completed"}
        title={plan.is_completed ? "Mark plan as pending" : "Mark plan as completed"}
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
};

export default MonthlyPlanner;
