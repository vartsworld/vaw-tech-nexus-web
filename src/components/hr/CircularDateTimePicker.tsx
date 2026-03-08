import { useState, useRef, useCallback } from "react";
import { Calendar, Clock } from "lucide-react";
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from "date-fns";

interface CircularDateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const CircularDateTimePicker = ({ date, time, onDateChange, onTimeChange }: CircularDateTimePickerProps) => {
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");
  const [viewMonth, setViewMonth] = useState(date ? new Date(date) : new Date());
  const [selectingHour, setSelectingHour] = useState(true);
  const clockRef = useRef<SVGSVGElement>(null);

  const selectedDate = date ? new Date(date) : null;
  const [hour, minute] = time ? time.split(":").map(Number) : [0, 0];

  // Calendar logic
  const daysInMonth = getDaysInMonth(viewMonth);
  const firstDay = getDay(startOfMonth(viewMonth));
  const today = new Date();

  const handleDayClick = (day: number) => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    onDateChange(format(d, "yyyy-MM-dd"));
  };

  // Clock logic
  const getAngleFromEvent = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = clockRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const handleClockClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const angle = getAngleFromEvent(e);
    if (angle === null) return;

    if (selectingHour) {
      const h = Math.round(angle / 30) % 12 || 12;
      const newHour = hour >= 12 ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
      onTimeChange(`${String(newHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      setSelectingHour(false);
    } else {
      const m = Math.round(angle / 6) % 60;
      onTimeChange(`${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      setSelectingHour(true);
    }
  }, [selectingHour, hour, minute, onTimeChange, getAngleFromEvent]);

  const toggleAmPm = () => {
    const newHour = hour >= 12 ? hour - 12 : hour + 12;
    onTimeChange(`${String(newHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };

  // Clock face rendering
  const renderClockFace = () => {
    const radius = 90;
    const numberRadius = 72;
    const items = selectingHour ? 12 : 12;
    const currentValue = selectingHour ? (hour % 12 || 12) : minute;
    const handAngle = selectingHour
      ? ((hour % 12) / 12) * 360
      : (minute / 60) * 360;

    return (
      <svg
        ref={clockRef}
        viewBox="0 0 220 220"
        className="w-full max-w-[200px] mx-auto cursor-pointer select-none"
        onClick={handleClockClick}
      >
        {/* Outer glow ring */}
        <circle cx="110" cy="110" r="108" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
        <circle cx="110" cy="110" r={radius + 10} fill="hsl(var(--background) / 0.3)" stroke="hsl(var(--border) / 0.3)" strokeWidth="1" />

        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * 360;
          const rad = (a * Math.PI) / 180;
          const isMajor = i % 5 === 0;
          const r1 = radius + (isMajor ? 2 : 5);
          const r2 = radius + 8;
          return (
            <line
              key={i}
              x1={110 + r1 * Math.sin(rad)}
              y1={110 - r1 * Math.cos(rad)}
              x2={110 + r2 * Math.sin(rad)}
              y2={110 - r2 * Math.cos(rad)}
              stroke={isMajor ? "hsl(var(--primary) / 0.5)" : "hsl(var(--muted-foreground) / 0.2)"}
              strokeWidth={isMajor ? 1.5 : 0.5}
            />
          );
        })}

        {/* Hand */}
        {time && (
          <>
            <line
              x1="110"
              y1="110"
              x2={110 + (numberRadius - 10) * Math.sin((handAngle * Math.PI) / 180)}
              y2={110 - (numberRadius - 10) * Math.cos((handAngle * Math.PI) / 180)}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx={110 + (numberRadius - 10) * Math.sin((handAngle * Math.PI) / 180)}
              cy={110 - (numberRadius - 10) * Math.cos((handAngle * Math.PI) / 180)}
              r="6"
              fill="hsl(var(--primary))"
              opacity="0.9"
            />
          </>
        )}

        {/* Center dot */}
        <circle cx="110" cy="110" r="3" fill="hsl(var(--primary))" />

        {/* Numbers */}
        {selectingHour
          ? Array.from({ length: 12 }).map((_, i) => {
              const num = i === 0 ? 12 : i;
              const angle = (i / 12) * 360;
              const rad = (angle * Math.PI) / 180;
              const isSelected = num === (hour % 12 || 12);
              return (
                <text
                  key={i}
                  x={110 + numberRadius * Math.sin(rad)}
                  y={110 - numberRadius * Math.cos(rad) + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={isSelected ? "bold" : "normal"}
                  fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.7)"}
                  className="pointer-events-none"
                >
                  {num}
                </text>
              );
            })
          : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num, i) => {
              const angle = (i / 12) * 360;
              const rad = (angle * Math.PI) / 180;
              const isSelected = num === minute;
              return (
                <text
                  key={i}
                  x={110 + numberRadius * Math.sin(rad)}
                  y={110 - numberRadius * Math.cos(rad) + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isSelected ? "bold" : "normal"}
                  fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.7)"}
                  className="pointer-events-none"
                >
                  {String(num).padStart(2, "0")}
                </text>
              );
            })}
      </svg>
    );
  };

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-white/15 bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setActiveTab("date")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === "date"
              ? "bg-primary/20 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          {selectedDate ? format(selectedDate, "MMM dd") : "Date"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("time")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === "time"
              ? "bg-primary/20 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          {time || "Time"}
        </button>
      </div>

      {/* Date Picker - Circular Calendar */}
      {activeTab === "date" && (
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-4 space-y-3">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition">
              ‹
            </button>
            <span className="text-sm font-semibold text-foreground">{format(viewMonth, "MMMM yyyy")}</span>
            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition">
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getDate() === day && today.getMonth() === viewMonth.getMonth() && today.getFullYear() === viewMonth.getFullYear();
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === viewMonth.getMonth() && selectedDate?.getFullYear() === viewMonth.getFullYear();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-full flex items-center justify-center text-xs transition-all
                    ${isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 scale-110"
                      : isToday
                        ? "bg-primary/15 text-primary font-medium ring-1 ring-primary/30"
                        : "text-foreground/70 hover:bg-white/10 hover:text-foreground"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Picker - Clock Face */}
      {activeTab === "time" && (
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-4 space-y-3">
          {/* Display */}
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setSelectingHour(true)}
              className={`text-2xl font-bold tabular-nums transition-colors px-2 py-1 rounded-lg ${
                selectingHour ? "text-primary bg-primary/10" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {String(hour % 12 || 12).padStart(2, "0")}
            </button>
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <button
              type="button"
              onClick={() => setSelectingHour(false)}
              className={`text-2xl font-bold tabular-nums transition-colors px-2 py-1 rounded-lg ${
                !selectingHour ? "text-primary bg-primary/10" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {String(minute).padStart(2, "0")}
            </button>
            <button
              type="button"
              onClick={toggleAmPm}
              className="ml-2 text-xs font-bold rounded-full px-2.5 py-1 bg-white/10 text-foreground/70 hover:bg-white/15 transition"
            >
              {hour >= 12 ? "PM" : "AM"}
            </button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            {selectingHour ? "Select hour" : "Select minutes"}
          </p>

          {/* Clock face */}
          {renderClockFace()}
        </div>
      )}
    </div>
  );
};

export default CircularDateTimePicker;
