import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  user_id: string;
  full_name: string;
  department_id: string;
  role: string;
  profile_photo_url?: string;
  status?: string;
  completed_tasks?: number;
}

interface DepartmentStaffListProps {
  departmentId: string | null;
  currentUserId: string;
  onChatClick?: (userId: string) => void;
  onlineUsers?: Record<string, any>;
}

const DepartmentStaffList = ({ departmentId, currentUserId, onChatClick, onlineUsers = {} }: DepartmentStaffListProps) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentStaff();
    }
  }, [departmentId]);

  const fetchDepartmentStaff = async () => {
    try {
      setLoading(true);
      // Fetch staff in this department
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('department_id', departmentId)
        .neq('user_id', currentUserId); // exclude self if needed, or include self? User said "show all the staff"

      if (staffError) throw staffError;

      // Fetch task stats for these staff
      const { data: taskData, error: taskError } = await supabase
        .from('staff_tasks')
        .select('assigned_to, status');
      
      let taskStats: Record<string, number> = {};
      if (taskData) {
        taskData.forEach(task => {
          if (task.status === 'completed' && task.assigned_to) {
            taskStats[task.assigned_to] = (taskStats[task.assigned_to] || 0) + 1;
          }
        });
      }

      const formattedStaff = (staffData || []).map(member => ({
        ...member,
        completed_tasks: taskStats[member.user_id] || 0
      }));

      setStaff(formattedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load department staff.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-rose-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-zinc-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center p-12 bg-black/20 rounded-2xl border border-white/5">
        <h3 className="text-xl font-bold text-white mb-2">No Staff Found</h3>
        <p className="text-zinc-400">There are no other staff members in this department yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {staff.map((member) => {
        const isOnline = onlineUsers[member.user_id] || member.status === 'online';
        
        return (
          <Card key={member.user_id} className="bg-black/40 border-white/10 hover:border-white/20 transition-all backdrop-blur-md overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-white/10">
                    <AvatarImage src={member.profile_photo_url || ''} />
                    <AvatarFallback className="bg-zinc-800 text-white font-bold text-lg">
                      {member.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg truncate">{member.full_name || 'Staff Member'}</h3>
                  <p className="text-primary/80 text-sm font-medium truncate capitalize">{member.role?.replace('_', ' ') || 'Staff'}</p>
                  
                  <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-zinc-300">{member.completed_tasks} Tasks Done</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-3 flex justify-between items-center border-t border-white/5">
                <div className="text-xs text-zinc-500 font-medium">
                  {isOnline ? 'Active Now' : 'Offline'}
                </div>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-full px-4"
                  onClick={() => onChatClick && onChatClick(member.user_id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DepartmentStaffList;
