import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  TrendingUp,
  Target,
  Award,
  Clock,
  CheckCircle,
  Star,
  Trophy,
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PerformanceMetrics = () => {
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [overallMetrics, setOverallMetrics] = useState({
    avgTaskCompletion: 0,
    avgAttendance: 0,
    topPerformer: null,
    totalPoints: 0
  });
  const [timeFilter, setTimeFilter] = useState("month");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceData();
    fetchDepartments();
  }, [timeFilter, departmentFilter]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeFilter) {
      case "week":
        return { from: subDays(now, 7), to: now };
      case "month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "quarter":
        return { from: subDays(now, 90), to: now };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const { from, to } = getDateRange();
      
      // Get staff with their performance metrics
      let staffQuery = supabase
        .from('staff_profiles')
        .select(`
          *,
          departments!fk_staff_profiles_department(name),
          tasks_assigned:staff_tasks!fk_staff_tasks_assigned_to(
            id, status, points, completed_at, created_at
          ),
          attendance:staff_attendance!fk_staff_attendance_user(
            id, date, is_late, check_in_time
          ),
          points:user_points_log!fk_user_points_log_user(
            id, points, created_at
          )
        `);

      if (departmentFilter !== "all") {
        const dept = departments.find(d => d.name === departmentFilter);
        if (dept) {
          staffQuery = staffQuery.eq('department_id', dept.id);
        }
      }

      const { data: staffData, error: staffError } = await staffQuery;
      if (staffError) {
        console.error('Error fetching staff:', staffError);
        throw staffError;
      }

      // Process performance data
      const performanceData = (staffData || []).map(staff => {
        const tasks = Array.isArray(staff.tasks_assigned) ? staff.tasks_assigned : [];
        const attendance = Array.isArray(staff.attendance) ? staff.attendance : [];
        const points = Array.isArray(staff.points) ? staff.points : [];

        // Filter data by date range
        const filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate >= from && taskDate <= to;
        });

        const filteredAttendance = attendance.filter(att => {
          const attDate = new Date(att.date);
          return attDate >= from && attDate <= to;
        });

        const filteredPoints = points.filter(point => {
          const pointDate = new Date(point.created_at);
          return pointDate >= from && pointDate <= to;
        });

        // Calculate metrics
        const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
        const totalTasks = filteredTasks.length;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const attendanceRate = filteredAttendance.length > 0 ? 
          ((filteredAttendance.length - filteredAttendance.filter(att => att.is_late).length) / filteredAttendance.length) * 100 : 100;

        const totalPoints = filteredPoints.reduce((sum, point) => sum + point.points, 0);

        const avgResponseTime = completedTasks > 0 ? 
          filteredTasks
            .filter(task => task.status === 'completed' && task.completed_at)
            .reduce((sum, task) => {
              const created = new Date(task.created_at);
              const completed = new Date(task.completed_at);
              return sum + (completed.getTime() - created.getTime());
            }, 0) / completedTasks / (1000 * 60 * 60) : 0; // Convert to hours

        // Calculate overall score (weighted average)
        const overallScore = (
          taskCompletionRate * 0.4 +
          attendanceRate * 0.3 +
          Math.min((totalPoints / 100) * 100, 100) * 0.3
        );

        return {
          ...staff,
          metrics: {
            taskCompletionRate: Math.round(taskCompletionRate),
            attendanceRate: Math.round(attendanceRate),
            totalPoints,
            avgResponseTime: Math.round(avgResponseTime * 10) / 10,
            overallScore: Math.round(overallScore),
            completedTasks,
            totalTasks
          }
        };
      });

      // Sort by overall score
      performanceData.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
      setStaffPerformance(performanceData);

      // Calculate overall metrics
      const avgTaskCompletion = performanceData.length > 0 ?
        performanceData.reduce((sum, staff) => sum + staff.metrics.taskCompletionRate, 0) / performanceData.length : 0;

      const avgAttendance = performanceData.length > 0 ?
        performanceData.reduce((sum, staff) => sum + staff.metrics.attendanceRate, 0) / performanceData.length : 0;

      const totalPoints = performanceData.reduce((sum, staff) => sum + staff.metrics.totalPoints, 0);

      setOverallMetrics({
        avgTaskCompletion: Math.round(avgTaskCompletion),
        avgAttendance: Math.round(avgAttendance),
        topPerformer: performanceData[0] || null,
        totalPoints
      });

      // Calculate department stats
      const deptStats = departments.map(dept => {
         const deptStaff = performanceData.filter(staff => {
          // Safely access departments property
          const staffDept = staff.departments;
          if (!staffDept) return false;
          
          // Handle array format
          if (Array.isArray(staffDept)) {
            return staffDept[0]?.name === dept.name;
          }
          
          // Handle object format - check if it has name property
          if (typeof staffDept === 'object' && staffDept !== null && 'name' in staffDept) {
            return (staffDept as { name: string }).name === dept.name;
          }
          
          return false;
        });
        const avgScore = deptStaff.length > 0 ?
          deptStaff.reduce((sum, staff) => sum + staff.metrics.overallScore, 0) / deptStaff.length : 0;

        return {
          ...dept,
          staffCount: deptStaff.length,
          avgScore: Math.round(avgScore),
          totalTasks: deptStaff.reduce((sum, staff) => sum + staff.metrics.totalTasks, 0),
          completedTasks: deptStaff.reduce((sum, staff) => sum + staff.metrics.completedTasks, 0)
        };
      });

      setDepartmentStats(deptStats.sort((a, b) => b.avgScore - a.avgScore));

    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data.",
        variant: "destructive",
      });
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (score) => {
    if (score >= 90) return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (score >= 75) return { text: "Good", color: "bg-blue-100 text-blue-800" };
    if (score >= 60) return { text: "Average", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Needs Improvement", color: "bg-red-100 text-red-800" };
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Task Completion"
          value={`${overallMetrics.avgTaskCompletion}%`}
          subtitle="Team average"
          icon={Target}
          color="green"
        />
        <MetricCard
          title="Avg Attendance"
          value={`${overallMetrics.avgAttendance}%`}
          subtitle="On-time rate"
          icon={Clock}
          color="blue"
        />
        <MetricCard
          title="Total Points Earned"
          value={overallMetrics.totalPoints}
          subtitle="All team members"
          icon={Award}
          color="purple"
        />
        <MetricCard
          title="Top Performer"
          value={overallMetrics.topPerformer?.full_name || "N/A"}
          subtitle={overallMetrics.topPerformer ? `${overallMetrics.topPerformer.metrics.overallScore}% score` : "No data"}
          icon={Trophy}
          color="yellow"
        />
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Department Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{dept.name}</span>
                  </div>
                  <Badge variant="outline">{dept.staffCount} members</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {dept.completedTasks}/{dept.totalTasks} tasks
                  </div>
                  <div className="w-24">
                    <Progress value={dept.avgScore} className="h-2" />
                  </div>
                  <div className={`font-bold ${getPerformanceColor(dept.avgScore)}`}>
                    {dept.avgScore}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Task Completion</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffPerformance.map((staff, index) => {
                const badge = getPerformanceBadge(staff.metrics.overallScore);
                return (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="w-6 text-center font-medium">{index + 1}</span>
                        )}
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={staff.avatar_url} />
                          <AvatarFallback>
                            {staff.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{staff.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {Array.isArray(staff.departments) 
                              ? staff.departments[0]?.name 
                               : (staff.departments && typeof staff.departments === 'object' && 'name' in staff.departments) 
                                 ? (staff.departments as { name: string }).name
                                : 'Unassigned'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={staff.metrics.overallScore} className="h-2" />
                        </div>
                        <span className={`font-bold ${getPerformanceColor(staff.metrics.overallScore)}`}>
                          {staff.metrics.overallScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{staff.metrics.taskCompletionRate}%</div>
                        <div className="text-xs text-gray-500">
                          {staff.metrics.completedTasks}/{staff.metrics.totalTasks}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{staff.metrics.attendanceRate}%</div>
                        <div className="text-xs text-gray-500">
                          {staff.metrics.avgResponseTime}h avg
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {staff.metrics.totalPoints}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={badge.color}>
                        {badge.text}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {staffPerformance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No performance data available for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;