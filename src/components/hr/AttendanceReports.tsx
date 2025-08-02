import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon,
  Download,
  UserCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AttendanceReports = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalPresent: 0,
    totalLate: 0,
    avgAttendance: 0,
    perfectAttendance: 0
  });
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceData();
    fetchDepartments();
  }, [dateRange, filterDepartment]);

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

  const fetchAttendanceData = async () => {
    try {
      let query = supabase
        .from('staff_attendance')
        .select(`
          *,
          staff_profiles!staff_attendance_user_id_fkey(
            full_name,
            username,
            departments(name)
          )
        `)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by department if selected
      let filteredData = data || [];
      if (filterDepartment !== "all") {
        filteredData = filteredData.filter(record => 
          record.staff_profiles?.departments?.name === filterDepartment
        );
      }

      setAttendanceData(filteredData);

      // Calculate summary stats
      const totalRecords = filteredData.length;
      const lateRecords = filteredData.filter(record => record.is_late).length;
      const uniqueUsers = [...new Set(filteredData.map(record => record.user_id))];
      
      // Get total staff for percentage calculation
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('id', { count: 'exact' });

      const totalStaff = staffData?.length || 1;
      const avgAttendance = Math.round((uniqueUsers.length / totalStaff) * 100);

      // Calculate perfect attendance (no late records)
      const perfectAttendanceUsers = uniqueUsers.filter(userId => {
        return !filteredData.some(record => record.user_id === userId && record.is_late);
      });

      setSummaryStats({
        totalPresent: totalRecords,
        totalLate: lateRecords,
        avgAttendance,
        perfectAttendance: perfectAttendanceUsers.length
      });

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Check-in Time', 'Status', 'Department'];
    const csvContent = [
      headers.join(','),
      ...attendanceData.map(record => [
        record.date,
        record.staff_profiles?.full_name || 'Unknown',
        format(new Date(record.check_in_time), 'HH:mm:ss'),
        record.is_late ? 'Late' : 'On Time',
        record.staff_profiles?.departments?.name || 'Unassigned'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
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
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Attendance Reports</h2>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.from, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange({...dateRange, from: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.to, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange({...dateRange, to: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
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
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setDateRange({
                  from: startOfMonth(new Date()),
                  to: endOfMonth(new Date())
                })}
                className="w-full"
              >
                Reset to Current Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Present"
          value={summaryStats.totalPresent}
          subtitle="Check-ins recorded"
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Late Arrivals"
          value={summaryStats.totalLate}
          subtitle={`${summaryStats.totalPresent > 0 ? Math.round((summaryStats.totalLate / summaryStats.totalPresent) * 100) : 0}% of total`}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Attendance Rate"
          value={`${summaryStats.avgAttendance}%`}
          subtitle="Average attendance"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Perfect Attendance"
          value={summaryStats.perfectAttendance}
          subtitle="Employees with no late marks"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.staff_profiles?.full_name}</div>
                      <div className="text-sm text-gray-500">@{record.staff_profiles?.username}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {format(new Date(record.check_in_time), 'HH:mm:ss')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.is_late ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Late
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <UserCheck className="h-3 w-3 mr-1" />
                        On Time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.staff_profiles?.departments?.name || 'Unassigned'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {attendanceData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;