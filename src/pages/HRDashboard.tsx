import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Clock
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

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    activeTasks: 0,
    completedTasks: 0,
    departments: 0,
    avgAttendance: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total staff count
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('id', { count: 'exact' });

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('id', { count: 'exact' })
        .eq('date', today);

      // Get active tasks
      const { data: activeTasksData, error: activeTasksError } = await supabase
        .from('staff_tasks')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'in_progress']);

      // Get completed tasks this month
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const { data: completedTasksData, error: completedTasksError } = await supabase
        .from('staff_tasks')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .gte('completed_at', firstOfMonth.toISOString());

      // Get departments count
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id', { count: 'exact' });

      setStats({
        totalStaff: staffData?.length || 0,
        presentToday: attendanceData?.length || 0,
        activeTasks: activeTasksData?.length || 0,
        completedTasks: completedTasksData?.length || 0,
        departments: deptData?.length || 0,
        avgAttendance: staffData?.length ? Math.round((attendanceData?.length || 0) / staffData.length * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      });
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Get recent task completions - simplified query
      const { data: taskActivities, error: taskError } = await supabase
        .from('staff_tasks')
        .select('id, title, status, completed_at, updated_at, assigned_to')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      // Get recent attendance - simplified query
      const { data: attendanceActivities, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('id, check_in_time, is_late, user_id')
        .order('check_in_time', { ascending: false })
        .limit(5);

      const activities = [
        ...(taskActivities || []).map(task => ({
          type: 'task_completed',
          title: `Task "${task.title}" completed`,
          time: task.completed_at,
          icon: ClipboardList
        })),
        ...(attendanceActivities || []).map(attendance => ({
          type: 'attendance',
          title: `Staff member checked in${attendance.is_late ? ' (Late)' : ''}`,
          time: attendance.check_in_time,
          icon: attendance.is_late ? AlertCircle : UserCheck
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend = false }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend && <TrendingUp className="h-3 w-3" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Management Dashboard</h1>
            <p className="text-gray-600">Comprehensive staff and department management</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <activity.icon className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
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
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Task Completion Rate</span>
                      <Badge variant="outline">85%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Response Time</span>
                      <Badge variant="outline">2.4h</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Attendance Rate</span>
                      <Badge variant="outline">{stats.avgAttendance}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Employee Satisfaction</span>
                      <Badge variant="outline">4.2/5</Badge>
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

          <TabsContent value="departments">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="applications">
            <TeamApplicationsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HRDashboard;