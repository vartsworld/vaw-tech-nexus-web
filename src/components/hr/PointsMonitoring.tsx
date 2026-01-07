import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, TrendingUp, Award, Coins, Search, Calendar, User } from "lucide-react";
import { format } from "date-fns";

const PointsMonitoring = () => {
  const [pointsLog, setPointsLog] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    avgPointsPerUser: 0,
    topEarner: null as any,
    recentActivity: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchPointsData();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [pointsLog, searchTerm, filterCategory, filterPeriod]);

  const fetchPointsData = async () => {
    try {
      // Fetch points log with user profiles
      const { data: logsData, error: logsError } = await supabase
        .from('user_points_log')
        .select(`
          *,
          staff_profiles:user_id (
            full_name,
            username,
            avatar_url,
            total_points
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      setPointsLog(logsData || []);

      // Fetch staff with total points
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, username, avatar_url, total_points, department_id')
        .order('total_points', { ascending: false });

      if (staffError) throw staffError;

      setStaffList(staffData || []);

      // Calculate stats
      const totalPoints = staffData?.reduce((sum, staff) => sum + (staff.total_points || 0), 0) || 0;
      const avgPoints = staffData?.length ? Math.round(totalPoints / staffData.length) : 0;
      const topEarner = staffData?.[0] || null;

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLogs = logsData?.filter(log =>
        new Date(log.created_at) > sevenDaysAgo
      ) || [];
      const recentActivity = recentLogs.reduce((sum, log) => sum + log.points, 0);

      setStats({
        totalPoints,
        avgPointsPerUser: avgPoints,
        topEarner,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching points data:', error);
      toast({
        title: "Error",
        description: "Failed to load points data.",
        variant: "destructive",
      });
    }
  };

  const filterLogs = () => {
    let filtered = pointsLog;

    if (searchTerm) {
      filtered = filtered.filter(log => {
        const userName = log.staff_profiles?.full_name?.toLowerCase() || '';
        const reason = log.reason?.toLowerCase() || '';
        return userName.includes(searchTerm.toLowerCase()) ||
          reason.includes(searchTerm.toLowerCase());
      });
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(log => log.category === filterCategory);
    }

    if (filterPeriod !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filterPeriod) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(log =>
        new Date(log.created_at) >= filterDate
      );
    }

    setFilteredLogs(filtered);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      task: 'bg-blue-100 text-blue-800',
      attendance: 'bg-green-100 text-green-800',
      mood: 'bg-purple-100 text-purple-800',
      bonus: 'bg-yellow-100 text-yellow-800',
      penalty: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // --- Configuration Logic ---
  const [config, setConfig] = useState({
    attendance_points: 10,
    mood_points: 5,
    late_penalty: 2,
    vaw_coin_rate: 10
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: pointsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'points_config')
        .single();

      const { data: rateData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'vaw_coin_rate')
        .single();

      setConfig(prev => ({
        ...prev,
        // @ts-ignore
        ...(pointsData?.value || {}),
        // @ts-ignore
        vaw_coin_rate: rateData?.value?.inr_value || prev.vaw_coin_rate
      }));
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const handleUpdateConfig = async () => {
    setIsSavingConfig(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update Points Config
      const { error: pointsError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'points_config',
          value: {
            attendance_points: config.attendance_points,
            mood_points: config.mood_points,
            late_penalty: config.late_penalty
          },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        });

      // Update Coin Rate
      const { error: rateError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'vaw_coin_rate',
          value: { inr_value: config.vaw_coin_rate },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        });

      if (pointsError || rateError) throw pointsError || rateError;

      toast({
        title: "Success",
        description: "Points configuration updated successfully.",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-yellow-600" />
            Points & Reward Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attendance Points (Per Day)
              </label>
              <Input
                type="number"
                value={config.attendance_points}
                onChange={(e) => setConfig({ ...config, attendance_points: Number(e.target.value) })}
                className="bg-white dark:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Mood Check-in Points
              </label>
              <Input
                type="number"
                value={config.mood_points}
                onChange={(e) => setConfig({ ...config, mood_points: Number(e.target.value) })}
                className="bg-white dark:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Late Arrival Penalty
              </label>
              <Input
                type="number"
                value={config.late_penalty}
                onChange={(e) => setConfig({ ...config, late_penalty: Number(e.target.value) })}
                className="bg-white dark:bg-slate-950 text-red-600 font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Prioritize Coin Value (1 Coin = ₹?)
              </label>
              <div className="flex items-center relative">
                <span className="absolute left-3 text-slate-500 font-bold">₹</span>
                <Input
                  type="number"
                  step="0.1"
                  value={config.vaw_coin_rate}
                  onChange={(e) => setConfig({ ...config, vaw_coin_rate: Number(e.target.value) })}
                  className="pl-7 bg-white dark:bg-slate-950 font-bold text-green-700"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpdateConfig} disabled={isSavingConfig}>
              {isSavingConfig ? 'Saving Changes...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPointsPerUser.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per staff member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Earner</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topEarner?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground truncate">
              {stats.topEarner?.full_name || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Points Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.slice(0, 10).map((staff, index) => (
                <TableRow key={staff.user_id}>
                  <TableCell className="font-bold">
                    {index === 0 && <span className="text-yellow-500">🥇</span>}
                    {index === 1 && <span className="text-gray-400">🥈</span>}
                    {index === 2 && <span className="text-orange-600">🥉</span>}
                    {index > 2 && `#${index + 1}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {staff.avatar_url ? (
                        <img
                          src={staff.avatar_url}
                          alt={staff.full_name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{staff.full_name}</div>
                        <div className="text-xs text-gray-500">@{staff.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {staff.department_id ? 'Assigned' : 'Unassigned'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {staff.total_points?.toLocaleString() || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Points Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Points Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="mood">Mood</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No points activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.staff_profiles?.avatar_url ? (
                            <img
                              src={log.staff_profiles.avatar_url}
                              alt={log.staff_profiles.full_name}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                          <span className="font-medium">
                            {log.staff_profiles?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {log.points > 0 ? '+' : ''}{log.points}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(log.category || 'task')}>
                          {log.category || 'Task'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.reason}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsMonitoring;
