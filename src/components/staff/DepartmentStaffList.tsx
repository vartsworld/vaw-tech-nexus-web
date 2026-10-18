import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Search, 
  X, 
  Users, 
  ExternalLink,
  Shield,
  Crown,
  Sparkles,
  Mail,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  department_id?: string;
  role: string;
  email?: string;
  profile_photo_url?: string;
  avatar_url?: string;
  status?: string;
  completed_tasks?: number;
  in_progress_tasks?: number;
  departments?: { name: string } | null;
  staff_id_number?: string;
}

interface DepartmentStaffListProps {
  departmentId?: string | null;
  currentUserId: string;
  onChatClick?: (userId: string) => void;
  onlineUsers?: Record<string, any>;
}

const ROLE_FILTERS = ["All Staff", "Leadership", "Engineers", "Designers", "Marketing", "Interns"];

const DepartmentStaffList = ({ 
  departmentId, 
  currentUserId, 
  onChatClick, 
  onlineUsers = {} 
}: DepartmentStaffListProps) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Staff");
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartmentStaff();

    // Subscribe to presence/profile updates for live status
    const channel = supabase
      .channel("department-staff-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_profiles" },
        () => fetchDepartmentStaff()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [departmentId, currentUserId]);

  const fetchDepartmentStaff = async () => {
    try {
      setLoading(true);

      // Build query: if departmentId is specified, filter by it; otherwise get all approved staff
      let query = supabase
        .from("staff_profiles")
        .select(`
          id,
          user_id,
          full_name,
          department_id,
          role,
          email,
          profile_photo_url,
          avatar_url,
          staff_id_number,
          departments:departments!fk_staff_profiles_department(name)
        `)
        .eq("application_status", "approved")
        .order("full_name");

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data: staffData, error: staffError } = await query;
      if (staffError) throw staffError;

      // Extract IDs to query task statistics efficiently
      const memberUserIds = (staffData || [])
        .map(m => m.user_id)
        .filter(Boolean);

      let taskStats: Record<string, { completed: number; inProgress: number }> = {};

      if (memberUserIds.length > 0) {
        const { data: taskData } = await supabase
          .from("staff_tasks")
          .select("assigned_to, status")
          .in("assigned_to", memberUserIds);

        if (taskData) {
          taskData.forEach((task) => {
            if (!task.assigned_to) return;
            if (!taskStats[task.assigned_to]) {
              taskStats[task.assigned_to] = { completed: 0, inProgress: 0 };
            }
            if (task.status === "completed") {
              taskStats[task.assigned_to].completed += 1;
            } else {
              taskStats[task.assigned_to].inProgress += 1;
            }
          });
        }
      }

      const formattedStaff: StaffMember[] = (staffData || []).map((member) => ({
        ...member,
        completed_tasks: taskStats[member.user_id]?.completed || 0,
        in_progress_tasks: taskStats[member.user_id]?.inProgress || 0,
      }));

      setStaff(formattedStaff);
    } catch (error: any) {
      console.error("Error fetching staff directory:", error);
      toast({
        title: "Staff Directory",
        description: error.message || "Failed to load team directory data.",
        variant: "destructive",
      });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff by search and role chip
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      // Exclude self only if there are other members, or allow viewing self card
      const isSelf = member.user_id === currentUserId;

      // Search matching
      const matchesSearch =
        searchQuery.trim() === "" ||
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.departments?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Role chip matching
      if (selectedRole === "Leadership") {
        return (
          member.role?.includes("head") ||
          member.role?.includes("lead") ||
          member.role?.includes("admin") ||
          member.role?.includes("manager")
        );
      }
      if (selectedRole === "Engineers") {
        return (
          member.role?.includes("developer") ||
          member.role?.includes("engineer") ||
          member.role?.includes("tech") ||
          member.role?.includes("stack")
        );
      }
      if (selectedRole === "Designers") {
        return (
          member.role?.includes("design") ||
          member.role?.includes("ui") ||
          member.role?.includes("ux") ||
          member.role?.includes("art")
        );
      }
      if (selectedRole === "Marketing") {
        return (
          member.role?.includes("market") ||
          member.role?.includes("social") ||
          member.role?.includes("sales") ||
          member.role?.includes("content")
        );
      }
      if (selectedRole === "Interns") {
        return member.role?.includes("intern");
      }

      return true;
    });
  }, [staff, searchQuery, selectedRole, currentUserId]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Skeleton className="h-10 w-full sm:w-80 rounded-xl bg-white/5" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-black/30 border-white/5 p-5 space-y-4 rounded-3xl">
              <div className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-2xl bg-white/5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-white/10 rounded" />
                  <Skeleton className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
              <div className="pt-2 flex justify-between gap-2 border-t border-white/5">
                <Skeleton className="h-4 w-24 bg-white/5 rounded" />
                <Skeleton className="h-8 w-24 bg-white/10 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar & Role Filter Pills Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directory by name, role, email..."
            className="pl-10 pr-9 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl h-11 text-sm focus-visible:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ROLE_FILTERS.map((rf) => {
            const isActive = selectedRole === rf;
            return (
              <button
                key={rf}
                onClick={() => setSelectedRole(rf)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
                }`}
              >
                {rf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Count */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredStaff.length}</strong> team member{filteredStaff.length === 1 ? "" : "s"}
        </span>
        {(searchQuery || selectedRole !== "All Staff") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedRole("All Staff");
            }}
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Staff Members Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => {
            const isOnline = onlineUsers[member.user_id] || member.status === "online";
            const isSelf = member.user_id === currentUserId;
            const photoUrl = member.profile_photo_url || member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.full_name || "staff")}`;
            const isLead = member.role?.toLowerCase().includes("head") || member.role?.toLowerCase().includes("lead");

            return (
              <Card
                key={member.id || member.user_id}
                className="relative bg-gradient-to-b from-[#14141E]/90 to-[#0E0E15]/90 border border-white/10 hover:border-indigo-500/40 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-md overflow-hidden group flex flex-col justify-between"
              >
                {/* Top Corner Glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all pointer-events-none" />

                <CardContent className="p-5 pb-4 space-y-4">
                  {/* Avatar & Identifiers */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <Avatar className="w-14 h-14 rounded-2xl border-2 border-white/10 group-hover:border-indigo-500/40 transition-colors shadow-md">
                        <AvatarImage src={photoUrl} className="object-cover" />
                        <AvatarFallback className="bg-indigo-950 text-indigo-300 font-bold text-base">
                          {member.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Online Status Dot */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#12121A] ${
                          isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                        }`}
                        title={isOnline ? "Online Now" : "Offline"}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors truncate">
                          {member.full_name || "Team Member"}
                        </h3>
                        {isSelf && (
                          <Badge className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0 border-indigo-500/30">
                            You
                          </Badge>
                        )}
                        {isLead && (
                          <span title="Team Head / Lead" className="text-amber-400 text-xs">
                            👑
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-indigo-400 capitalize truncate mt-0.5">
                        {member.role?.replace(/_/g, " ") || "Staff"}
                      </p>

                      {member.departments?.name && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {member.departments.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Task Performance Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Completed</div>
                        <div className="text-xs font-bold text-white">{member.completed_tasks || 0} Tasks</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">In Progress</div>
                        <div className="text-xs font-bold text-white">{member.in_progress_tasks || 0} Active</div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`} />
                    <span>{isOnline ? "Active Now" : "Offline"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Public Staff ID Card Link */}
                    {member.staff_id_number && (
                      <Link
                        to={`/${member.staff_id_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs border border-white/5 transition-colors gap-1"
                        title="View Official Staff ID Card"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">ID</span>
                      </Link>
                    )}

                    {/* Chat Action */}
                    <Button
                      size="sm"
                      onClick={() => onChatClick && onChatClick(member.user_id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 px-3 text-xs gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-black/20 border border-white/5 max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Staff Members Found</h3>
          <p className="text-xs text-zinc-400">
            {searchQuery
              ? `No members matching "${searchQuery}". Try a different keyword.`
              : "There are currently no staff profiles registered under this department."}
          </p>
          {(searchQuery || selectedRole !== "All Staff") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("All Staff");
              }}
              className="border-white/10 text-white hover:bg-white/5 text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentStaffList;
