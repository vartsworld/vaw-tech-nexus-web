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
  DialogTrigger
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
  Trash2
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

interface MonthlyPlan {
  id: string;
  date: string;
  title: string;
  description: string;
  created_by: string;
  department_id: string;
  assigned_staff: string[];
  created_at: string;
}

interface MonthlyPlannerProps {
  userId: string;
  userProfile: any;
}

const MonthlyPlanner = ({ userId, userProfile }: MonthlyPlannerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MonthlyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    assigned_staff: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, [currentMonth]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('monthly_plans')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

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
          assigned_staff: newPlan.assigned_staff
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
      setNewPlan({ title: '', description: '', assigned_staff: [] });
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
          assigned_staff: newPlan.assigned_staff
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
      setNewPlan({ title: '', description: '', assigned_staff: [] });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
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
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-background border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {days.map((day, i) => (
          <div key={i} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
              "min-h-[100px] border-r border-b p-1 transition-colors hover:bg-muted/30 cursor-pointer flex flex-col",
              !isSameMonth(currentDay, monthStart) && "bg-muted/20 text-muted-foreground",
              isToday(currentDay) && "bg-blue-500/5"
            )}
            onClick={() => {
              setSelectedDate(currentDay);
              if (dayPlans.length > 0) {
                setSelectedPlan(dayPlans[0]);
                setIsViewDialogOpen(true);
              } else {
                setNewPlan({ title: '', description: '', assigned_staff: [] });
                setIsAddDialogOpen(true);
              }
            }}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                isToday(currentDay) && "bg-blue-500 text-white"
              )}>
                {format(currentDay, 'd')}
              </span>
              {dayPlans.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {dayPlans.length}
                </Badge>
              )}
            </div>
            <div className="mt-1 space-y-1 flex-1 overflow-hidden">
              {dayPlans.slice(0, 3).map((plan, idx) => (
                <div
                  key={idx}
                  className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded truncate"
                  title={plan.title}
                >
                  {plan.title}
                </div>
              ))}
              {dayPlans.length > 3 && (
                <div className="text-[9px] text-muted-foreground pl-1">
                  + {dayPlans.length - 3} more
                </div>
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

  return (
    <Card className="w-full shadow-xl border-white/10 bg-black/40 backdrop-blur-md overflow-hidden">
      <CardHeader className="p-0">
        {renderHeader()}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-full">
          <div className="min-w-[600px]">
            {renderDays()}
            {renderCells()}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Edit Daily Plan' : 'Add Daily Plan'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={selectedDate ? format(selectedDate, 'PPP') : ''}
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Plan Title</Label>
              <Input
                id="title"
                placeholder="Marketing Strategy, Dev Sprint, etc."
                value={newPlan.title}
                onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Details</Label>
              <Textarea
                id="description"
                placeholder="Describe the plan for today..."
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={selectedPlan ? handleUpdatePlan : handleAddPlan}>
              {selectedPlan ? 'Update Plan' : 'Save Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  {selectedPlan.title}
                </DialogTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(selectedPlan.date), 'EEEE, MMMM do')}
                </div>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPlan.description || "No description provided."}
                  </p>
                </div>
                {selectedPlan.created_by === userId && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setNewPlan({
                          title: selectedPlan.title,
                          description: selectedPlan.description,
                          assigned_staff: selectedPlan.assigned_staff
                        });
                        setIsViewDialogOpen(false);
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeletePlan(selectedPlan.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MonthlyPlanner;
