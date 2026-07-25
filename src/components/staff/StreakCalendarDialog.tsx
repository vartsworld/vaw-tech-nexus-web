import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Flame, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Award, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StreakCalendarDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function calculateStreaks(dates: string[]): { current: number; longest: number } {
  // Only count dates starting from August 1, 2026
  const validDates = dates.filter(d => d >= "2026-08-01");
  if (validDates.length === 0) return { current: 0, longest: 0 };

  const uniqueDates = Array.from(new Set(validDates)).sort();
  if (uniqueDates.length === 0) return { current: 0, longest: 0 };

  // 1. Calculate Longest Streak
  let longest = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of uniqueDates) {
    const currentDate = new Date(dateStr);
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRun += 1;
      } else if (diffDays > 1) {
        if (currentRun > longest) {
          longest = currentRun;
        }
        currentRun = 1;
      }
    }
    prevDate = currentDate;
  }
  if (currentRun > longest) {
    longest = currentRun;
  }

  // 2. Calculate Current Streak (sequential days backwards from today/yesterday)
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let current = 0;
  const sortedDesc = [...uniqueDates].sort((a, b) => b.localeCompare(a));

  const hasToday = sortedDesc.includes(todayStr);
  const hasYesterday = sortedDesc.includes(yesterdayStr);

  if (hasToday || hasYesterday) {
    const checkDate = hasToday ? new Date() : yesterday;
    // Cap backward search to August 1, 2026
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (checkStr < "2026-08-01") break;
      if (sortedDesc.includes(checkStr)) {
        current += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { current, longest: Math.max(longest, current) };
}

const StreakCalendarDialog = ({ isOpen, onOpenChange, userId }: StreakCalendarDialogProps) => {
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 7 is August (0-indexed: 0=Jan, 7=Aug)

  const fetchAttendance = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff_attendance")
        .select("date")
        .eq("user_id", userId)
        .gte("date", "2026-08-01");

      if (error) throw error;
      const dates = (data || []).map(row => row.date);
      setAttendanceDates(dates);
    } catch (e) {
      console.error("Error fetching attendance for streak:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
      // Set to current month/year if it is later than August 2026
      const now = new Date();
      if (now.getFullYear() > 2026 || (now.getFullYear() === 2026 && now.getMonth() >= 7)) {
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
      } else {
        setCurrentYear(2026);
        setCurrentMonth(7);
      }
    }
  }, [isOpen, userId]);

  const { current: currentStreak, longest: longestStreak } = calculateStreaks(attendanceDates);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentYear === 2026 && currentMonth === 7) return; // Block prior to August 2026
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Calendar calculations
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/95 border-white/10 text-white max-w-[90vw] max-h-[90vh] overflow-y-auto sm:max-w-[460px] rounded-[2rem] shadow-2xl backdrop-blur-3xl p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10 pointer-events-none" />

        <div className="p-6 space-y-6 relative z-10">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse shrink-0" />
              Daily Streak
            </DialogTitle>
          </DialogHeader>

          {/* Streaks Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center relative overflow-hidden group shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-1 animate-bounce" />
              <h4 className="text-2xl font-black text-white">{currentStreak}d</h4>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Current Streak</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center relative overflow-hidden group shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
              <h4 className="text-2xl font-black text-white">{longestStreak}d</h4>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Longest Streak</p>
            </div>
          </div>

          {/* Calendar Header */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                disabled={currentYear === 2026 && currentMonth === 7}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/80 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-sm text-white/90">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/40 uppercase tracking-wider">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map((_, idx) => (
                <div key={`blank-${idx}`} className="aspect-square" />
              ))}

              {daysArray.map(day => {
                const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isMarked = attendanceDates.includes(formattedDateStr);
                const isToday = new Date().toISOString().split('T')[0] === formattedDateStr;

                return (
                  <div
                    key={`day-${day}`}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all relative ${
                      isMarked
                        ? "bg-gradient-to-br from-orange-600/30 to-orange-500/10 border border-orange-500/30 text-orange-300 shadow-sm shadow-orange-500/10"
                        : isToday
                        ? "border border-white/30 text-white bg-white/5"
                        : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <span>{day}</span>
                    {isMarked && (
                      <Flame className="w-2.5 h-2.5 text-orange-500 absolute bottom-1 scale-90 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center text-[10px] text-white/30 font-medium">
            The daily streak system officially began on <span className="text-white/50">August 1, 2026 (Saturday)</span>.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StreakCalendarDialog;
