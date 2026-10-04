import React, { useState, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Calendar as CalendarIcon,
  Download,
  UserCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  Zap,
  Activity
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
      const query = supabase
        .from('staff_attendance')
        .select(`
          *,
          staff_profiles!inner(
            full_name,
            username,
            department_id,
            departments!fk_staff_profiles_department(name)
          )
        `)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch mood entries for the same date range
      const { data: moodData } = await supabase
        .from('user_mood_entries')
        .select('*')
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

      // Merge attendance with mood data
      const mergedData = (data || []).map(record => {
        const moodEntry = moodData?.find(m => m.user_id === record.user_id && m.date === record.date);
        return {
          ...record,
          mood: moodEntry?.mood,
          note: moodEntry?.personal_quote
        };
      });

      // Filter by department if selected
      let filteredData = mergedData;
      if (filterDepartment !== "all") {
        filteredData = filteredData.filter(record => {
          const profile = record.staff_profiles as any;
          return profile?.departments?.name === filterDepartment;
        });
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
        record.check_in_time ? format(new Date(record.check_in_time), 'hh:mm:ss a') : 'N/A',
        record.is_late ? 'Late' : 'On Time',
        record.staff_profiles?.departments?.name || 'Unassigned',
        record.mood || 'N/A',
        record.note || 'N/A'
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          <h2 className="text-xl md:text-2xl font-bold">Attendance Reports</h2>
        </div>
        <Button onClick={exportToCSV} size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-xs md:text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
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
                    <Button variant="outline" className="w-full justify-start text-xs md:text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-xs md:text-sm">
                    Reset to Current Month
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset your date filters to the current month.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date())
                      })}
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
          subtitle="No late marks"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg">Attendance Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Employee</TableHead>
                  <TableHead className="whitespace-nowrap">Check-in Time</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Department</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Emotion</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  if (attendanceData.length === 0) return null;
                  
                  // Group by date
                  const groupedData: Record<string, typeof attendanceData> = {};
                  attendanceData.forEach(record => {
                    const d = record.date || 'unknown';
                    if (!groupedData[d]) groupedData[d] = [];
                    groupedData[d].push(record);
                  });

                  // Sort dates descending
                  const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

                  return sortedDates.map((dateStr, groupIndex) => {
                    // Alternate row shading for groups
                    const baseBgClass = groupIndex % 2 === 0 ? "bg-muted/30" : "bg-transparent";
                    
                    return (
                      <React.Fragment key={dateStr}>
                        {/* Date Header Row */}
                        <TableRow className={`hover:bg-transparent ${baseBgClass}`}>
                          <TableCell colSpan={5} className="font-semibold text-sm py-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-blue-500" />
                              {dateStr !== 'unknown' ? format(new Date(dateStr), 'MMM dd, yyyy') : 'Unknown Date'}
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Records for this date */}
                        {groupedData[dateStr].map(record => {
                          // Client-side late calculation: if difference between check_in_time and date > 24 hours
                          let isLate24h = false;
                          if (record.check_in_time && record.date) {
                             const checkIn = new Date(record.check_in_time).getTime();
                             const expected = new Date(record.date).getTime();
                             isLate24h = (checkIn - expected) > 24 * 60 * 60 * 1000;
                          }
                          
                          const rowBgClass = isLate24h ? "bg-red-500/10 hover:bg-red-500/20" : baseBgClass;

                          return (
                            <TableRow key={record.id} className={rowBgClass}>
                              <TableCell>
                                <div className="pl-6">
                                  <div className="font-medium text-sm">{record.staff_profiles?.full_name}</div>
                                  <div className="text-xs text-gray-500">@{record.staff_profiles?.username}</div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                                  <span className="text-xs md:text-sm">
                                    {record.check_in_time ? format(new Date(record.check_in_time), 'hh:mm a') : 'N/A'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm">
                                {record.staff_profiles?.departments?.name || 'Unassigned'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {record.mood ? (
                                  <div className="flex items-center gap-2">
                                    {record.mood === 'happy' && <span title="Happy"><Smile className="h-4 w-4 text-green-500" /></span>}
                                    {record.mood === 'neutral' && <span title="Neutral"><Meh className="h-4 w-4 text-blue-500" /></span>}
                                    {record.mood === 'sad' && <span title="Sad"><Frown className="h-4 w-4 text-orange-500" /></span>}
                                    {record.mood === 'stressed' && <span title="Stressed"><Zap className="h-4 w-4 text-red-500" /></span>}
                                    {record.mood === 'excited' && <span title="Excited"><Activity className="h-4 w-4 text-purple-500" /></span>}
                                    <span className="capitalize text-sm">{record.mood}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {record.note ? (
                                  <div className="flex items-center gap-2 group relative">
                                    <MessageSquare className="h-4 w-4 text-gray-400 shrink-0" />
                                    <span className="text-sm truncate max-w-[150px]" title={record.note}>
                                      {record.note}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
          {attendanceData.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No attendance records found for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;