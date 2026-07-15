import React, { useState, useEffect } from 'react';
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
  Check
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
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    assigned_staff: [] as string[],
    client_id: 'common',
    color: '#3b82f6'
  });
  const { toast } = useToast();

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Slate', value: '#64748b' }
  ];

  useEffect(() => {
    fetchPlans();
    fetchClients();
  }, [currentMonth, filterClientId]);

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

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
        {days.map((day, i) => (
          <div key={i} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayPlans = plans.filter(p => isSameDay(parseISO(p.date), currentDay));

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[100px] border-r border-b border-white/5 p-2 transition-all hover:bg-white/[0.03] cursor-pointer flex flex-col group",
              !isSameMonth(currentDay, monthStart) && "bg-white/[0.01] text-white/10",
              isToday(currentDay) && "bg-primary/5"
            )}
            onClick={() => {
              setSelectedDate(currentDay);
              setIsDayDetailOpen(true);
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-xs font-black px-2 py-0.5 rounded-md transition-colors",
                isToday(currentDay) ? "bg-primary text-black" : "text-white/40 group-hover:text-white"
              )}>
                {format(currentDay, 'd')}
              </span>
              {dayPlans.length > 0 && !isMobile && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/10 bg-white/5 text-white/50">
                  {dayPlans.length}
                </Badge>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-1 overflow-hidden">
              {isMobile ? (
                /* Mobile Dots View */
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: plan.color || '#3b82f6' }}
                    />
                  ))}
                </div>
              ) : (
                /* Desktop Plan Blocks */
                <>
                  {dayPlans.slice(0, 3).map((plan, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: `${plan.color || '#3b82f6'}20`,
                        borderColor: `${plan.color || '#3b82f6'}40`,
                        color: plan.color || '#3b82f6'
                      }}
                      className="text-[10px] border px-2 py-1 rounded-md truncate font-bold uppercase tracking-tight"
                      title={plan.title}
                    >
                      {plan.title}
                    </div>
                  ))}
                  {dayPlans.length > 3 && (
                    <div className="text-[9px] text-white/20 font-black uppercase tracking-widest pl-1 pt-1">
                      + {dayPlans.length - 3} more
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

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

  const selectedDayPlans = selectedDate ? plans.filter(p => isSameDay(parseISO(p.date), selectedDate)) : [];
  const { common: commonPlans, clientGrouped } = getGroupedPlans(selectedDayPlans);

  return (
    <Card className="w-full shadow-2xl border-white/5 bg-zinc-950/40 backdrop-blur-xl overflow-hidden rounded-3xl">
      <CardHeader className="p-0">
        {renderHeader()}
      </CardHeader>
      <CardContent className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-4xl bg-zinc-900/40 border border-white/5 rounded-3xl p-3 sm:p-6 backdrop-blur-md">
          <ShadcnCalendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate || undefined}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setIsDayDetailOpen(true);
              }
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
              day: "h-full w-full p-0 font-bold text-white hover:bg-white/10 rounded-2xl flex flex-col items-center justify-center transition-all border border-transparent aria-selected:bg-primary aria-selected:text-black",
              day_today: "border-primary/50 text-primary bg-primary/5 hover:bg-primary/20",
              day_selected: "bg-primary text-black hover:bg-primary hover:text-black focus:bg-primary focus:text-black",
              day_outside: "text-zinc-600 opacity-30",
            }}
            components={{
              DayContent: ({ date }) => {
                const dayPlans = plans.filter(p => isSameDay(parseISO(p.date), date));
                return (
                  <div className="relative flex flex-col items-center justify-center w-full h-full p-2">
                    <span className="text-sm sm:text-base">{date.getDate()}</span>
                    {dayPlans.length > 0 && (
                      <div className="absolute bottom-2 flex gap-1 justify-center w-full px-1 overflow-hidden">
                        {dayPlans.slice(0, 3).map((plan, idx) => (
                          <span
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: plan.color || '#3b82f6' }}
                          />
                        ))}
                        {dayPlans.length > 3 && (
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

              {selectedDayPlans.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-white font-bold uppercase text-sm tracking-widest">No Plans for today</h3>
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
                    {colors.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewPlan({ ...newPlan, color: c.value })}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all hover:scale-125 border-2",
                          newPlan.color === c.value ? "border-white scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c.value }}
                        title={customTagNames[c.value] || c.name}
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
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Planner Settings</DialogTitle>
            <DialogDescription className="text-white/40 uppercase text-[10px] font-bold tracking-widest">
              Customize your planning environment
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/80">Tag Legend & Renaming</h4>
              <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider leading-none">
                Click text to customize names
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colors.map(c => {
                  const displayName = customTagNames[c.value] || c.name;
                  return (
                    <div key={c.value} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.value }} />
                      <input
                        type="text"
                        className="bg-transparent border-none focus:ring-0 focus:outline-none text-[10px] font-black text-white uppercase p-0 w-full"
                        value={displayName}
                        onChange={(e) => {
                          const next = { ...customTagNames, [c.value]: e.target.value };
                          setCustomTagNames(next);
                          localStorage.setItem('vaw_planner_custom_tags', JSON.stringify(next));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-[10px] text-white/20 italic text-center">
              Planner tag legend settings are persistent and synchronized locally.
            </p>
          </div>
          <Button onClick={() => setIsSettingsOpen(false)} className="w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold uppercase text-xs h-11">
            Done
          </Button>
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
