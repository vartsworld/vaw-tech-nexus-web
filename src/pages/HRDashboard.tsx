import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LogOut
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [hrProfile, setHrProfile] = useState<any>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    select: 'id',
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

  // Calculate stats from real-time data
  const stats = {
    totalStaff: staffData?.length || 0,
    presentToday: attendanceData?.length || 0,
    activeTasks: activeTasksData?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length || 0,
    completedTasks: completedTasksData?.length || 0,
    departments: departmentsData?.length || 0,
    avgAttendance: staffData?.length ? Math.round(((attendanceData?.length || 0) / staffData.length) * 100) : 0,
  };

  // Combine recent activities
  const recentActivities = [
    ...(recentTasksData || []).map((task: any) => ({
      type: 'task_completed',
      title: `Task "${task.title}" completed`,
      time: task.completed_at,
      icon: ClipboardList,
    })),
    ...(recentAttendanceData || []).map((attendance: any) => ({
      type: 'attendance',
      title: `Staff member checked in${attendance.is_late ? ' (Late)' : ''}`,
      time: attendance.check_in_time,
      icon: attendance.is_late ? AlertCircle : UserCheck,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff/login");
  };

  useEffect(() => {
    fetchHRProfile();

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
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

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (!profile) {
        // No profile found, redirect to 404 or login
        navigate("/404");
        return;
      }

      // Access Control: Only HR and Super Admin
      if (profile.role !== 'hr' && profile.role !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this dashboard.",
          variant: "destructive"
        });
        navigate("/404"); // As requested
        return;
      }

      if (error) throw error;
      setHrProfile(profile);

      if (profile?.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', profile.department_id)
          .single();

        if (dept) {
          setDepartmentName(dept.name);
        }
      }
    } catch (error) {
      console.error('Error fetching HR profile:', error);
    }
  };


  const StatCard = ({ title, value, subtitle, icon: Icon, trend = false }) => (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            {trend && <TrendingUp className="h-3 w-3" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 md:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">HR Management Dashboard</h1>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
              Comprehensive staff and department management
              {hrProfile?.full_name && ` • ${hrProfile.full_name}`}
              {departmentName && ` • ${departmentName} Department`}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </Button>
            <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs md:text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100">
              <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Last updated: </span>{new Date().toLocaleTimeString()}
            </Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="w-full overflow-x-auto flex md:grid md:grid-cols-12 justify-start md:justify-center h-auto p-1">
            <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="banners" className="whitespace-nowrap">Banners</TabsTrigger>
            <TabsTrigger value="staff" className="whitespace-nowrap">Staff</TabsTrigger>
            <TabsTrigger value="attendance" className="whitespace-nowrap">Attendance</TabsTrigger>
            <TabsTrigger value="tasks" className="whitespace-nowrap">Tasks</TabsTrigger>
            <TabsTrigger value="templates" className="whitespace-nowrap">Templates</TabsTrigger>
            <TabsTrigger value="clients" className="whitespace-nowrap">Clients</TabsTrigger>
            <TabsTrigger value="departments" className="whitespace-nowrap">Departments</TabsTrigger>
            <TabsTrigger value="performance" className="whitespace-nowrap">Performance</TabsTrigger>
            <TabsTrigger value="points" className="whitespace-nowrap">Points</TabsTrigger>
            <TabsTrigger value="rewards" className="whitespace-nowrap">Rewards Store</TabsTrigger>
            <TabsTrigger value="notifications" className="whitespace-nowrap">Notifications</TabsTrigger>
            <TabsTrigger value="applications" className="whitespace-nowrap">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                title="Total Staff"
                value={stats.totalStaff}
                subtitle="Active employees"
                icon={Users}
              />
              <StatCard
                title="Present Today"
                value={stats.presentToday}
                subtitle={`${stats.avgAttendance}% attendance`}
                icon={UserCheck}
                trend={true}
              />
              <StatCard
                title="Active Tasks"
                value={stats.activeTasks}
                subtitle="In progress"
                icon={ClipboardList}
              />
              <StatCard
                title="Completed Tasks"
                value={stats.completedTasks}
                subtitle="This month"
                icon={BarChart3}
                trend={true}
              />
              <StatCard
                title="Departments"
                value={stats.departments}
                subtitle="Active departments"
                icon={Building2}
              />
              <StatCard
                title="Avg Performance"
                value="87%"
                subtitle="Team efficiency"
                icon={TrendingUp}
                trend={true}
              />
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-gray-50">
                        <activity.icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm">Task Completion Rate</span>
                      <Badge variant="outline" className="text-xs">85%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm">Average Response Time</span>
                      <Badge variant="outline" className="text-xs">2.4h</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm">Attendance Rate</span>
                      <Badge variant="outline" className="text-xs">{stats.avgAttendance}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm">Employee Satisfaction</span>
                      <Badge variant="outline" className="text-xs">4.2/5</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceReports />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManagement />
          </TabsContent>

          <TabsContent value="templates">
            <TaskTemplateManagement />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="points">
            <PointsMonitoring />
          </TabsContent>

          <TabsContent value="rewards">
            <div className="space-y-6">
              <RewardsManagement />
              <RedemptionApprovals />
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="banners">
            <BannerManagement />
          </TabsContent>

          <TabsContent value="applications">
            <TeamApplicationsList />
          </TabsContent>
        </Tabs>
      </div>
      <PWAInstallPrompt />
    </div >
  );
};

export default HRDashboard;