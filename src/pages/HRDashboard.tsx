import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  ClipboardList,
  BarChart3,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  Building2,
  Clock,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  Trophy,
  Bell,
  Layers,
  FileText,
  Megaphone,
  UserPlus,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Star,
  Activity,
  FolderSearch,
  DollarSign,
  Zap,
  Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Sub-components
import StaffManagement from "@/components/hr/StaffManagement";
import AttendanceReports from "@/components/hr/AttendanceReports";
import TaskManagement from "@/components/hr/TaskManagement";
import DepartmentManagement from "@/components/hr/DepartmentManagement";
import PerformanceMetrics from "@/components/hr/PerformanceMetrics";
import NotificationCenter from "@/components/hr/NotificationCenter";
import TeamApplicationsList from "@/components/hr/TeamApplicationsList";
import ClientManagement from "@/components/hr/ClientManagement";
import PointsMonitoring from "@/components/hr/PointsMonitoring";
import RewardsManagement from "@/components/hr/RewardsManagement";
import RedemptionApprovals from "@/components/hr/RedemptionApprovals";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import BannerManagement from "@/components/hr/BannerManagement";
import TaskTemplateManagement from "@/components/hr/TaskTemplateManagement";
import ManageProjects from "@/components/hr/ManageProjects";
import ProjectMonitor from "@/pages/ProjectMonitor";
import PricingManagement from "@/components/hr/PricingManagement";
import ApiIntegration from "@/components/hr/ApiIntegration";
import FinancialOversight from "@/components/hr/FinancialOversight";

const HRDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  let activeTab = pathParts[2] || "dashboard";
  if (activeTab === "overview") activeTab = "dashboard";

  const [hrProfile, setHrProfile] = useState<any>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark for premium feel
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { toast } = useToast();

  // Real-time queries for dashboard data
  const { data: staffData } = useRealtimeQuery({
    queryKey: ['staff-profiles'],
    table: 'staff_profiles',
    select: 'id',
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData } = useRealtimeQuery({
    queryKey: ['attendance-today', today],
    table: 'staff_attendance',
    filter: `date=eq.${today}`,
    select: 'id',
  });

  const { data: activeTasksData } = useRealtimeQuery({
    queryKey: ['active-tasks'],
    table: 'staff_tasks',
    select: 'id, status',
  });

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const { data: completedTasksData } = useRealtimeQuery({
    queryKey: ['completed-tasks', firstOfMonth.toISOString()],
    table: 'staff_tasks',
    filter: `status=eq.completed`,
    select: 'id',
  });

  const { data: departmentsData } = useRealtimeQuery({
    queryKey: ['departments'],
    table: 'departments',
    select: 'id',
  });

  const { data: recentTasksData } = useRealtimeQuery({
    queryKey: ['recent-completed-tasks'],
    table: 'staff_tasks',
    filter: 'status=eq.completed',
    select: 'id, title, completed_at, updated_at, assigned_to',
    order: { column: 'completed_at', ascending: false },
    limit: 5,
  });

  const { data: recentAttendanceData } = useRealtimeQuery({
    queryKey: ['recent-attendance'],
    table: 'staff_attendance',
    select: 'id, check_in_time, is_late, user_id',
    order: { column: 'check_in_time', ascending: false },
    limit: 5,
  });

  // Calculate stats
  const stats = useMemo(() => ({
    totalStaff: staffData?.length || 0,
    presentToday: attendanceData?.length || 0,
    activeTasks: activeTasksData?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length || 0,
    completedTasks: completedTasksData?.length || 0,
    departments: departmentsData?.length || 0,
    avgAttendance: staffData?.length ? Math.round(((attendanceData?.length || 0) / staffData.length) * 100) : 0,
  }), [staffData, attendanceData, activeTasksData, completedTasksData, departmentsData]);

  const recentActivities = useMemo(() => {
    const activities = [
      ...(recentTasksData || []).map((task: any) => ({
        type: 'task_completed',
        title: `Task "${task.title}" completed`,
        time: task.completed_at,
        icon: ClipboardList,
        color: "text-green-500"
      })),
      ...(recentAttendanceData || []).map((attendance: any) => ({
        type: 'attendance',
        title: `Staff member checked in${attendance.is_late ? ' (Late)' : ''}`,
        time: attendance.check_in_time,
        icon: attendance.is_late ? AlertCircle : UserCheck,
        color: attendance.is_late ? "text-amber-500" : "text-blue-500"
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
    return activities;
  }, [recentTasksData, recentAttendanceData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff/login");
  };

  useEffect(() => {
    fetchHRProfile();
    // Default to dark mode for the premium "Wow" effect
    document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchHRProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/staff/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!profile || (profile.role !== 'hr' && profile.role !== 'super_admin')) {
        navigate("/404");
        return;
      }

      setHrProfile(profile);

      if (profile?.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', profile.department_id)
          .single();
        if (dept) setDepartmentName(dept.name);
      }
    } catch (error) {
      console.error('Error fetching HR profile:', error);
    }
  };

  const menuGroups = [
    {
      label: "CORE",
      items: [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "staff", label: "Staff Directory", icon: Users },
        { id: "departments", label: "Departments", icon: Building2 },
      ]
    },
    {
      label: "OPERATIONS",
      items: [
        { id: "tasks", label: "Task Board", icon: ClipboardList },
        { id: "templates", label: "Task Templates", icon: Layers },
        { id: "attendance", label: "Attendance", icon: Calendar },
      ]
    },
    {
      label: "RELATIONSHIPS",
      items: [
        { id: "clients", label: "Clients", icon: Briefcase },
        { id: "manage-projects", label: "Manage Projects", icon: FolderSearch },
        { id: "project-monitor", label: "Project Monitor", icon: Activity },
        { id: "financials", label: "Financial Oversight", icon: DollarSign },
        { id: "pricing", label: "Pricing Manager", icon: Tag },
        { id: "applications", label: "Applications", icon: UserPlus },
      ]
    },
    {
      label: "PERFORMANCE",
      items: [
        { id: "performance", label: "Metrics", icon: BarChart3 },
        { id: "points", label: "Points System", icon: Star },
        { id: "rewards", label: "Rewards Store", icon: Trophy },
      ]
    },
    {
      label: "COMPANY",
      items: [
        { id: "api-integration", label: "API Integration", icon: Zap },
        { id: "banners", label: "Banners", icon: Megaphone },
        { id: "notifications", label: "Notifications", icon: Bell },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <div className="space-y-6"><StatsGrid stats={stats} /><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Activities activities={recentActivities} /><PerformanceInsights stats={stats} /></div></div>;
      case "staff": return <StaffManagement />;
      case "attendance": return <AttendanceReports />;
      case "tasks": return <TaskManagement />;
      case "templates": return <TaskTemplateManagement />;
      case "clients": return <ClientManagement />;
      case "manage-projects": return <ManageProjects />;
      case "project-monitor": return <ProjectMonitor standalone={true} />;
      case "departments": return <DepartmentManagement />;
      case "performance": return <PerformanceMetrics />;
      case "points": return <PointsMonitoring />;
      case "rewards": return <div className="space-y-6"><RewardsManagement /><RedemptionApprovals /></div>;
      case "notifications": return <NotificationCenter />;
      case "banners": return <BannerManagement />;
      case "applications": return <TeamApplicationsList />;
      case "pricing": return <PricingManagement />;
      case "financials": return <FinancialOversight />;
      case "api-integration": return <ApiIntegration />;
      default: return <StatsGrid stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 h-full bg-card/80 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-300 ease-in-out"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg tracking-tight text-foreground">VAW HR</span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                <ShieldCheck className="w-6 h-6 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:bg-muted text-muted-foreground"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6 py-4">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                {isSidebarOpen && (
                  <h3 className="px-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {group.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/hr/${item.id}`)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative
                        ${activeTab === item.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                      `}
                    >
                      <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium tracking-wide">
                          {item.label}
                        </span>
                      )}
                      {activeTab === item.id && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-y-2 left-0 w-1 bg-primary rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      {isSidebarOpen && activeTab === item.id && (
                        <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-muted/50 ${!isSidebarOpen && 'justify-center'}`}>
            <Avatar className="h-9 w-9 border border-primary/30">
              <AvatarImage src={hrProfile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {hrProfile?.full_name?.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{hrProfile?.full_name || 'HR Admin'}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">{hrProfile?.role || 'HR'}</p>
              </div>
            )}
            {isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative z-10">
        {/* Top bar */}
        <header className="h-20 border-b border-border px-8 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight capitalize text-foreground">
              {activeTab.replace('-', ' ')}
            </h2>
            <Separator orientation="vertical" className="h-6 bg-border" />
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Team efficiency is up 12% this week</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Universal search..."
                className="w-64 bg-muted/50 border-border pl-10 h-9 rounded-full focus:ring-primary focus:border-primary transition-all text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/hr/notifications')} className="relative text-gray-400 hover:text-white hover:bg-white/5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0c0c0c]" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-gray-400 hover:text-white hover:bg-white/5">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Dynamic Section Rendering */}
        <ScrollArea className="flex-1">
          <div className="p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>

      <PWAInstallPrompt />
    </div>
  );
};

// --- Dashboard Component Sections ---

const StatsGrid = ({ stats }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    <PremiumStatCard
      title="Total Force"
      value={stats.totalStaff}
      subtitle="Active Workforce"
      icon={Users}
      gradient="from-blue-600 to-indigo-600"
    />
    <PremiumStatCard
      title="Today's Attendance"
      value={`${stats.avgAttendance}%`}
      subtitle={`${stats.presentToday} members present`}
      icon={UserCheck}
      gradient="from-green-600 to-emerald-600"
      trend="+4% from yesterday"
    />
    <PremiumStatCard
      title="Live Operations"
      value={stats.activeTasks}
      subtitle="Running Tasks"
      icon={ClipboardList}
      gradient="from-orange-600 to-red-600"
    />
    <PremiumStatCard
      title="Strategic Units"
      value={stats.departments}
      subtitle="Active Departments"
      icon={Building2}
      gradient="from-purple-600 to-violet-600"
    />
  </div>
);

const PremiumStatCard = ({ title, value, subtitle, icon: Icon, gradient, trend }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="group relative overflow-hidden p-6 rounded-[2rem] bg-[#111] border border-white/5"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity duration-500`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-gray-400 text-xs font-bold tracking-wider uppercase">{title}</h3>
      <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </motion.div>
);

const Activities = ({ activities }: any) => (
  <Card className="bg-[#111] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
    <CardHeader className="border-b border-white/5 p-6">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Live Pulse
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">View Log</Button>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <ScrollArea className="h-[400px]">
        <div className="p-6 space-y-4">
          {activities.length > 0 ? activities.map((activity: any, idx: number) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group"
            >
              <div className={`p-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 group-hover:scale-110 transition-transform ${activity.color}`}>
                <activity.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium tracking-wide truncate">{activity.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {new Date(activity.time).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Clock className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">No recent activities</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);

const PerformanceInsights = ({ stats }: any) => (
  <Card className="bg-[#111] border-white/5 rounded-[2rem] shadow-2xl">
    <CardHeader className="p-6">
      <CardTitle className="text-lg flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        Intelligence
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 pt-0 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm text-gray-400 font-medium">Monthly Efficiency</span>
          <span className="text-sm font-bold text-white">87%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "87%" }}
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Response Time</p>
          <p className="text-xl font-bold text-white">2.4h</p>
          <div className="text-[10px] text-green-500 mt-1 flex items-center gap-1 font-bold">
            <TrendingUp className="h-3 w-3" />
            15% FASTER
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Satisfaction</p>
          <p className="text-xl font-bold text-white">4.8/5</p>
          <div className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1 font-bold">
            <Sparkles className="h-3 w-3" />
            TOP TIER
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-sm text-indigo-200 leading-relaxed italic">
        "Team velocity is high. Focus on completing templates to automate repetitive workflows in the next sprint."
      </div>
    </CardContent>
  </Card>
);

export default HRDashboard;