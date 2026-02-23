import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttendanceCheckerProps {
  userId: string;
  onAttendanceMarked: () => void;
}

const AttendanceChecker = ({ userId, onAttendanceMarked }: AttendanceCheckerProps) => {
  const [isMarking, setIsMarking] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    checkTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [userId]);

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking attendance:', error);
        return;
      }

      setTodayAttendance(data);
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const markAttendance = async () => {
    setIsMarking(true);
    try {
      // Fetch points config
      const { data: configData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'points_config')
        .single();

      // Defaults if config missing
      const config = {
        attendance_points: 10,
        late_penalty: 2,
        ...(configData?.value || {}) // @ts-ignore
      };

      const now = new Date();
      // Define window: 05:30 AM to 18:30 (6:30 PM)
      const startWindow = new Date();
      startWindow.setHours(5, 30, 0, 0);

      const endWindow = new Date();
      endWindow.setHours(18, 30, 0, 0);

      // Logic: Marked WITHIN window = On Time. Before or After = Late.
      // Request: "mark the attentance within 5:30 to 18:30 wont be marked as late and those who marked before or after the timer being will be considered late."
      const isLate = now < startWindow || now > endWindow;

      // Check if attendance already exists for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existingAttendance) {
        toast({
          title: "Already Marked!",
          description: "You've already marked your attendance for today.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('staff_attendance')
        .insert({
          user_id: userId,
          check_in_time: now.toISOString(),
          is_late: isLate
        });

      if (error) throw error;

      // Calculate points
      const points = isLate
        ? Math.max(0, config.attendance_points - config.late_penalty)
        : config.attendance_points;

      // Check if attendance points are enabled by HR
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'points_config')
        .single();
      const attendanceEnabled = settingsData?.value?.attendance_points_enabled !== false;

      if (attendanceEnabled && points > 0) {
        // Log to user_points_log (for HR PointsMonitoring)
        await supabase
          .from('user_points_log')
          .insert({
            user_id: userId,
            points,
            reason: isLate ? 'Attendance (Outside Standard Hours)' : 'Attendance (On Time)',
            category: 'attendance'
          });

        // Log to user_coin_transactions (for PointsBalance / MyCoins)
        await supabase
          .from('user_coin_transactions')
          .insert({
            user_id: userId,
            coins: points,
            transaction_type: 'earning',
            description: isLate ? 'Attendance (Outside Standard Hours)' : 'Attendance (On Time)',
            source_type: 'attendance'
          });

        // Update staff_profiles.total_points
        const { data: profileData } = await supabase
          .from('staff_profiles')
          .select('total_points')
          .eq('user_id', userId)
          .single();

        if (profileData) {
          await supabase
            .from('staff_profiles')
            .update({ total_points: (profileData.total_points || 0) + points })
            .eq('user_id', userId);
        }
      }

      toast({
        title: "Attendance Marked!",
        description: attendanceEnabled && points > 0
          ? isLate
            ? `Marked outside standard hours. Earned ${points} points.`
            : `On time! Earned ${points} points!`
          : "Attendance recorded. Points are currently disabled by HR.",
      });

      onAttendanceMarked();
      checkTodayAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      if (error.code === '23505') {
        toast({
          title: "Already Marked!",
          description: "You've already marked your attendance for today.",
        });
        // If attendance was already marked, still proceed to next step
        onAttendanceMarked();
      } else {
        toast({
          title: "Error",
          description: "Failed to mark attendance. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsMarking(false);
    }
  };

  const updateAttendanceStreak = async (userId: string) => {
    // Simplified - removed to avoid RLS recursion issues
    console.log('Attendance streak update skipped due to RLS issues');
  };

  if (todayAttendance) {
    return (
      <Card className="bg-green-500/20 border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Attendance Marked!</h3>
              <p className="text-green-300">
                Checked in at {new Date(todayAttendance.check_in_time).toLocaleTimeString()}
                {todayAttendance.is_late && (
                  <span className="text-yellow-300 ml-2">(Late)</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Mark Your Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-blue-300">
              {currentTime.toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/80">
            <MapPin className="w-4 h-4" />
            <span>VAW Technologies Office</span>
          </div>

          <Button
            onClick={markAttendance}
            disabled={isMarking}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
            size="lg"
          >
            {isMarking ? "Marking Attendance..." : "✅ Mark Attendance & Enter Office"}
          </Button>

          <div className="text-xs text-white/60 text-center">
            <p>Work hours: 9:00 AM - 6:00 PM</p>
            <p>On-time attendance: +10 points | Late: +5 points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceChecker;