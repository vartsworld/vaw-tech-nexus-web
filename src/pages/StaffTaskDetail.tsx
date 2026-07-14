import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TaskDetailDialog } from "@/components/staff/TaskDetailDialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const StaffTaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTeamHead, setIsTeamHead] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/staff/login");
          return;
        }
        setUserId(user.id);

        // Fetch user profile to check if is_department_head / team_head
        const { data: profile } = await supabase
          .from('staff_profiles')
          .select('is_department_head, role')
          .eq('user_id', user.id)
          .single();
        
        setIsTeamHead(profile?.is_department_head || profile?.role === 'team_head');

        const { data: taskData, error } = await supabase
          .from('staff_tasks')
          .select('*, due_time, trial_period, attachments, comments')
          .eq('id', taskId)
          .single();

        if (error || !taskData) {
          toast({ title: "Error", description: "Task not found", variant: "destructive" });
          navigate(-1);
          return;
        }

        const { data: assignerData } = await supabase
          .from('staff_profiles')
          .select('full_name')
          .eq('user_id', taskData.assigned_by)
          .single();

        setTask({
          ...taskData,
          assignedBy: assignerData,
          attachments: taskData.attachments || [],
          comments: taskData.comments || []
        });
      } catch (err) {
        console.error("Error fetching task details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, navigate, toast]);

  const handleStatusUpdate = async (tId: string, newStatus: any) => {
    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({ status: newStatus })
        .eq('id', tId);
      if (error) throw error;
      setTask((prev: any) => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Loading task details...</p>
      </div>
    );
  }

  if (!task || !userId) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header bar to easily go back */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/60 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate tracking-tight">{task.title}</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Task Details</p>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <TaskDetailDialog
            task={task}
            open={true}
            onOpenChange={() => {}}
            onStatusUpdate={handleStatusUpdate}
            userId={userId}
            mode="inline"
            onBack={() => navigate(-1)}
            isTeamHead={isTeamHead}
          />
        </div>
      </main>
    </div>
  );
};

export default StaffTaskDetail;