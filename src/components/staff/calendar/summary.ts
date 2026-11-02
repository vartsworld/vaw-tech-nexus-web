import type { CalendarEvent } from "calendarkit-pro";
import { addDays, endOfMonth, isSameDay, startOfDay, startOfMonth } from "date-fns";

export interface PlannerSummary {
  /** Soonest unfinished task or subtask from today on */
  next: CalendarEvent | null;
  today: number;
  monthTotal: number;
  completed: number;
  pending: number;
  overdue: number;
  plans: number;
  /** 0..100 share of this month's tasks that are done */
  progress: number;
}

const isWork = (e: CalendarEvent) => e.type === "task" || e.type === "subtask";

/**
 * Numbers for the calendar sidebar. `events` must still contain completed items
 * (hiding completed work on the grid must not change the totals).
 */
export function summarize(events: CalendarEvent[], month: Date, now: Date = new Date()): PlannerSummary {
  const dayStart = startOfDay(now);
  const mStart = startOfMonth(month).getTime();
  const mEnd = addDays(endOfMonth(month), 1).getTime();

  const inMonth = (e: CalendarEvent) => e.start.getTime() >= mStart && e.start.getTime() < mEnd;

  const monthWork = events.filter((e) => isWork(e) && inMonth(e));
  const completed = monthWork.filter((e) => e.completed).length;
  const pendingWork = monthWork.filter((e) => !e.completed);

  const upcoming = events
    .filter((e) => isWork(e) && !e.completed && startOfDay(e.start).getTime() >= dayStart.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime() || (a.type === b.type ? 0 : a.type === "task" ? -1 : 1));

  return {
    next: upcoming[0] ?? null,
    today: events.filter((e) => isWork(e) && !e.completed && isSameDay(e.start, now)).length,
    monthTotal: monthWork.length,
    completed,
    pending: pendingWork.length,
    // Overdue is not limited to the month on screen
    overdue: events.filter((e) => isWork(e) && !e.completed && startOfDay(e.start).getTime() < dayStart.getTime()).length,
    plans: events.filter((e) => e.type === "plan" && inMonth(e)).length,
    progress: monthWork.length ? Math.round((completed / monthWork.length) * 100) : 0,
  };
}
