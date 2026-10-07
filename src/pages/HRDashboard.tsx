import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStaffData } from "@/hooks/useStaffData";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";

// HR Components
import StaffManagement from "@/components/hr/StaffManagement";
import AttendanceReports from "@/components/hr/AttendanceReports";
import TaskManagement from "@/components/hr/TaskManagement";
import TaskTemplateManagement from "@/components/hr/TaskTemplateManagement";
import ClientManagement from "@/components/hr/ClientManagement";
import DepartmentManagement from "@/components/hr/DepartmentManagement";
import PerformanceMetrics from "@/components/hr/PerformanceMetrics";
import PointsMonitoring from "@/components/hr/PointsMonitoring";
import RewardsManagement from "@/components/hr/RewardsManagement";
import RedemptionApprovals from "@/components/hr/RedemptionApprovals";
import NotificationCenter from "@/components/hr/NotificationCenter";
import BannerManagement from "@/components/hr/BannerManagement";
import TeamApplicationsList from "@/components/hr/TeamApplicationsList";
import InternshipApplicationsList from "@/components/admin/InternshipApplicationsList";
import PricingManagement from "@/components/hr/PricingManagement";
import FinancialOversight from "@/components/hr/FinancialOversight";
import ApiIntegration from "@/components/hr/ApiIntegration";
import SupportTicketManagement from "@/components/hr/SupportTicketManagement";
import AcademyEnquiriesList from "@/components/hr/AcademyEnquiriesList";
import ManageProjects from "@/components/hr/ManageProjects";
import QRManagement from "@/components/hr/QRManagement";
import EmmaAssistant from "@/components/ai/EmmaAssistant";

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Lucide Icons
import {
  Users, CheckSquare, Settings2, HandCoins, Building2, BarChart3,
  Award, Bell, Image as ImageIcon, Briefcase, UserPlus, CreditCard,
  DollarSign, Code, LifeBuoy, GraduationCap, LayoutDashboard,
  Sparkles, TrendingUp, Clock, AlertCircle, UserCheck, QrCode,
  FolderKanban, ChevronRight, ShieldCheck
} from "lucide-react";

// Recharts
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from "recharts";

export default function HRDashboard() {
  const { profile: userProfile, loading: profileLoading } = useStaffData();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const [currentRoom, setCurrentRoom] = useState('dashboard');
  const [showAttendanceChecker, setShowAttendanceChecker] = useState(false);
  const [showMoodChecker, setShowMoodChecker] = useState(false);
  const [initialChecksDone, setInitialChecksDone] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    
    if (!userProfile) {
      navigate('/staff/login');
      return;
    }

    if (userProfile.role !== 'hr' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      navigate('/staff');
      return;
    }

    const checkDailyRequirements = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Check if user has marked attendance today
        const { data: attendanceData } = await supabase
          .from('staff_attendance')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .eq('date', today)
          .maybeSingle();

        // Check if user has submitted mood today
        const { data: moodData } = await supabase
          .from('user_mood_entries')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .eq('entry_date', today)
          .maybeSingle();

        if (!attendanceData) {
          setShowAttendanceChecker(true);
          setShowMoodChecker(false);
        } else if (!moodData) {
          setShowAttendanceChecker(false);
          setShowMoodChecker(true);
        } else {
          setShowAttendanceChecker(false);
          setShowMoodChecker(false);
          setInitialChecksDone(true);
        }
      } catch (error) {
        console.error("Error checking daily requirements:", error);
        setInitialChecksDone(true); // Fallback to let them in if DB fails
      }
    };

    checkDailyRequirements();
  }, [userProfile, profileLoading, navigate]);

  // Synchronize room state from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchRoom = Array.from(params.keys())[0];
    const pathParts = location.pathname.split('/');
    const pathRoom = pathParts[2] || pathParts[1];

    if (searchRoom && searchRoom !== 'dashboard' && searchRoom !== 'hr') {
      setCurrentRoom(searchRoom);
    } else if (pathRoom && pathRoom !== 'hr' && pathRoom !== 'dashboard') {
      setCurrentRoom(pathRoom);
    } else {
      setCurrentRoom('dashboard');
    }
  }, [location.search, location.pathname]);

  const handleRoomChange = (room: string) => {
    setCurrentRoom(room);
    if (room === 'legacy') {
      navigate('/hr/legacy');
    } else if (room === 'dashboard' || room === 'home') {
      navigate('/hr');
    } else {
      navigate(`/hr?${room}`);
    }
  };

  if (profileLoading || (!initialChecksDone && !showAttendanceChecker && !showMoodChecker)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading HR Portal...</p>
        </div>
      </div>
    );
  }

  if (showAttendanceChecker) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Step 1: Mark Attendance</h2>
            <p className="text-white/80">Please mark your attendance to access the HR Dashboard</p>
          </div>
          <AttendanceChecker 
            userId={userProfile?.user_id || ''}
            onAttendanceMarked={async () => {
              setShowAttendanceChecker(false);
              const today = new Date().toISOString().split('T')[0];
              const { data: moodData } = await supabase
                .from('user_mood_entries')
                .select('*')
                .eq('user_id', userProfile?.user_id)
                .eq('entry_date', today)
                .maybeSingle();
                
              if (!moodData) {
                setShowMoodChecker(true);
              } else {
                setInitialChecksDone(true);
              }
            }} 
          />
        </div>
      </div>
    );
  }

  if (showMoodChecker) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Step 2: How are you feeling?</h2>
            <p className="text-white/80">Share your daily status to unlock your dashboard</p>
          </div>
          <MoodQuoteChecker 
            onMoodSubmitted={() => {
              setShowMoodChecker(false);
              setInitialChecksDone(true);
            }} 
          />
        </div>
      </div>
    );
  }

  const customSidebarLinks = [
    {
      title: "Core & AI",
      icon: Sparkles,
      items: [
        { id: 'dashboard', name: 'Overview', icon: LayoutDashboard, path: '/hr?dashboard' },
        { id: 'emma', name: 'EMMA AI', icon: Sparkles, path: '/hr?emma' },
      ]
    },
    {
      title: "Operations",
      icon: FolderKanban,
      items: [
        { id: 'staff', name: 'Staff Directory', icon: Users, path: '/hr?staff' },
        { id: 'departments', name: 'Departments', icon: Building2, path: '/hr?departments' },
        { id: 'tasks', name: 'Task Board', icon: CheckSquare, path: '/hr?tasks' },
        { id: 'templates', name: 'Templates', icon: Settings2, path: '/hr?templates' },
        { id: 'attendance', name: 'Attendance', icon: HandCoins, path: '/hr?attendance' },
      ]
    },
    {
      title: "Relationships",
      icon: Users,
      items: [
        { id: 'clients', name: 'Clients', icon: Briefcase, path: '/hr?clients' },
        { id: 'manage-projects', name: 'Projects', icon: FolderKanban, path: '/hr?manage-projects' },
        { id: 'applications', name: 'Team Applications', icon: UserPlus, path: '/hr?applications' },
        { id: 'interns', name: 'Intern Applications', icon: GraduationCap, path: '/hr?interns' },
        { id: 'support', name: 'Support Tickets', icon: LifeBuoy, path: '/hr?support' },
        { id: 'academy', name: 'Academy Enquiries', icon: Award, path: '/hr?academy' },
      ]
    },
    {
      title: "Performance & Rewards",
      icon: BarChart3,
      items: [
        { id: 'performance', name: 'Performance', icon: BarChart3, path: '/hr?performance' },
        { id: 'points', name: 'Points & Analytics', icon: Award, path: '/hr?points' },
        { id: 'rewards', name: 'Rewards & Store', icon: Award, path: '/hr?rewards' },
      ]
    },
    {
      title: "Administration",
      icon: Settings2,
      items: [
        { id: 'financials', name: 'Financial Oversight', icon: DollarSign, path: '/hr?financials' },
        { id: 'pricing', name: 'Pricing Manager', icon: CreditCard, path: '/hr?pricing' },
        { id: 'notifications', name: 'Notifications', icon: Bell, path: '/hr?notifications' },
        { id: 'banners', name: 'Banner Manager', icon: ImageIcon, path: '/hr?banners' },
        { id: 'api-integration', name: 'API Integrations', icon: Code, path: '/hr?api-integration' },
        { id: 'qr', name: 'QR Manager', icon: QrCode, path: '/hr?qr' },
        { id: 'legacy', name: 'Legacy Admin', icon: ShieldCheck, path: '/hr/legacy' }
      ]
    }
  ];

  const renderRoomContent = () => {
    switch (currentRoom) {
      case 'dashboard':
      case 'home':
        return <HROverviewCommandCenter onNavigate={handleRoomChange} />;
      case 'emma': return <EmmaAssistant role="hr" />;
      case 'tasks': return <TaskManagement />;
      case 'templates': return <TaskTemplateManagement />;
      case 'attendance': return <AttendanceReports />;
      case 'staff': return <StaffManagement />;
      case 'departments': return <DepartmentManagement />;
      case 'clients': return <ClientManagement />;
      case 'manage-projects': return <ManageProjects />;
      case 'applications': return <TeamApplicationsList />;
      case 'interns': return <InternshipApplicationsList />;
      case 'support': return <SupportTicketManagement />;
      case 'academy': return <AcademyEnquiriesList />;
      case 'performance': return <PerformanceMetrics />;
      case 'points': return <PointsMonitoring />;
      case 'rewards': return <div className="space-y-6"><RewardsManagement /><RedemptionApprovals /></div>;
      case 'pricing': return <PricingManagement />;
      case 'financials': return <FinancialOversight />;
      case 'notifications': return <NotificationCenter />;
      case 'banners': return <BannerManagement />;
      case 'api-integration': return <ApiIntegration />;
      case 'qr': return <QRManagement />;
      default: 
        return <HROverviewCommandCenter onNavigate={handleRoomChange} />;
    }
  };

  return (
    <VirtualOfficeLayout
      currentRoom={currentRoom}
      onRoomChange={handleRoomChange}
      userId={userProfile?.user_id}
      userProfile={userProfile}
      customSidebarLinks={customSidebarLinks}
    >
      <div className="p-2 sm:p-4 md:p-6 pb-24 lg:pb-6 animate-in fade-in duration-300 relative z-10 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderRoomContent()}
        </div>
      </div>
    </VirtualOfficeLayout>
  );
}

// ── HR Overview Command Center Component ──
interface HROverviewProps {
  onNavigate: (room: string) => void;
}

function HROverviewCommandCenter({ onNavigate }: HROverviewProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data: staffData } = useRealtimeQuery({
    queryKey: ['staff-profiles-overview'],
    table: 'staff_profiles',
    select: 'id, full_name, role, department_id, total_points',
  });

  const { data: attendanceData } = useRealtimeQuery({
    queryKey: ['attendance-today-overview', today],
    table: 'staff_attendance',
    filter: `date=eq.${today}`,
    select: 'id, is_late, check_in_time, user_id',
  });

  const { data: tasksData } = useRealtimeQuery({
    queryKey: ['staff-tasks-overview'],
    table: 'staff_tasks',
    select: 'id, status, priority, title, created_at',
  });

  const { data: departmentsData } = useRealtimeQuery({
    queryKey: ['departments-overview'],
    table: 'departments',
    select: 'id, name',
  });

  const { data: teamAppsData } = useRealtimeQuery({
    queryKey: ['team-applications-overview'],
    table: 'team_applications',
    filter: 'status=eq.pending',
    select: 'id',
  });

  const { data: internAppsData } = useRealtimeQuery({
    queryKey: ['internship-applications-overview'],
    table: 'internship_applications',
    filter: 'status=neq.deleted',
    select: 'id',
  });

  const { data: supportTicketsData } = useRealtimeQuery({
    queryKey: ['support-tickets-overview'],
    table: 'support_tickets',
    select: 'id, status',
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalStaff = staffData?.length || 0;
    const presentToday = attendanceData?.length || 0;
    const lateToday = attendanceData?.filter((a: any) => a.is_late)?.length || 0;
    const attendancePct = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;

    const pendingTasks = tasksData?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress')?.length || 0;
    const completedTasks = tasksData?.filter((t: any) => t.status === 'completed')?.length || 0;

    const pendingApps = (teamAppsData?.length || 0) + (internAppsData?.length || 0);
    const openTickets = supportTicketsData?.filter((st: any) => st.status !== 'closed' && st.status !== 'resolved')?.length || 0;

    return {
      totalStaff,
      presentToday,
      lateToday,
      attendancePct,
      pendingTasks,
      completedTasks,
      departmentsCount: departmentsData?.length || 0,
      pendingApps,
      openTickets
    };
  }, [staffData, attendanceData, tasksData, departmentsData, teamAppsData, internAppsData, supportTicketsData]);

  // Chart Data: Weekly attendance trend mock
  const attendanceTrendData = [
    { day: "Mon", attendance: 88, target: 95 },
    { day: "Tue", attendance: 92, target: 95 },
    { day: "Wed", attendance: 95, target: 95 },
    { day: "Thu", attendance: 90, target: 95 },
    { day: "Fri", attendance: metrics.attendancePct || 94, target: 95 },
  ];

  // Task status distribution data
  const taskDistributionData = [
    { name: "Active", value: metrics.pendingTasks, fill: "#3b82f6" },
    { name: "Completed", value: metrics.completedTasks, fill: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900/80 border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-3 py-1 font-mono">
                HR COMMAND CENTER
              </Badge>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Workforce Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time synchronization across organization staff, tasks, attendance, inquiries, and application pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              onClick={() => onNavigate('emma')}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-primary/20 gap-2 flex-1 md:flex-none"
            >
              <Sparkles className="w-4 h-4" />
              Ask EMMA AI
            </Button>
            <Button
              onClick={() => onNavigate('staff')}
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs h-10 px-4 rounded-xl gap-2 flex-1 md:flex-none"
            >
              <Users className="w-4 h-4" />
              Staff Directory
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="bg-card/70 border-white/10 backdrop-blur-md rounded-2xl hover:border-primary/50 transition-all">
          <CardContent className="p-4 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Staff</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{metrics.totalStaff}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Across {metrics.departmentsCount} Departments</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-white/10 backdrop-blur-md rounded-2xl hover:border-emerald-500/50 transition-all">
          <CardContent className="p-4 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Today</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">{metrics.attendancePct}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {metrics.presentToday} Present {metrics.lateToday > 0 && `(${metrics.lateToday} Late)`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-white/10 backdrop-blur-md rounded-2xl hover:border-amber-500/50 transition-all">
          <CardContent className="p-4 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Tasks</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{metrics.pendingTasks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{metrics.completedTasks} Completed Tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-white/10 backdrop-blur-md rounded-2xl hover:border-purple-500/50 transition-all">
          <CardContent className="p-4 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Pipeline Applications</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{metrics.pendingApps}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{metrics.openTickets} Open Support Tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Buttons */}
      <Card className="bg-card/70 border-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Quick Operations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onNavigate('tasks')}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 text-foreground rounded-xl transition-all"
          >
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-semibold">Task Board</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate('staff')}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-foreground rounded-xl transition-all"
          >
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">Manage Staff</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate('applications')}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 text-foreground rounded-xl transition-all"
          >
            <UserPlus className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-semibold">Applications</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate('financials')}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-white/10 bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 text-foreground rounded-xl transition-all"
          >
            <DollarSign className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold">Financials</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate('support')}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 text-foreground rounded-xl transition-all"
          >
            <LifeBuoy className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold">Support Desk</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate('pricing')}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/50 text-foreground rounded-xl transition-all"
          >
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold">Pricing</span>
          </Button>
        </div>
      </Card>

      {/* Analytics Charts & Live Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance & Velocity Analytics */}
        <Card className="lg:col-span-2 bg-card/70 border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Weekly Attendance Velocity
                </CardTitle>
                <CardDescription className="text-xs">Live daily organization attendance % rate</CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">
                Target: 95%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-[220px] sm:h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#attendanceColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Operational Status */}
        <Card className="bg-card/70 border-white/10 backdrop-blur-md rounded-2xl flex flex-col">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Live Pulse
            </CardTitle>
            <CardDescription className="text-xs">Recent tasks & system updates</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-[240px] sm:h-[280px]">
              <div className="p-4 space-y-3">
                {tasksData && tasksData.length > 0 ? (
                  tasksData.slice(0, 6).map((task: any) => (
                    <div key={task.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3 text-xs">
                      <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {task.status === 'completed' ? <UserCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{task.status?.replace('_', ' ')} • {new Date(task.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">No recent task activity</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
