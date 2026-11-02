import { format, isSameDay, addDays } from "date-fns";
import { AlertTriangle, CalendarCheck2, CheckCircle2, CircleDashed, ClipboardList, Flag, ListTodo } from "lucide-react";
import type { CalendarEvent } from "calendarkit-pro";
import { cn } from "@/lib/utils";
import type { PlannerSummary } from "./summary";

const relativeDay = (d: Date) => {
  const now = new Date();
  if (isSameDay(d, now)) return "Today";
  if (isSameDay(d, addDays(now, 1))) return "Tomorrow";
  return format(d, "EEE, d MMM");
};

/** Strip the decorative prefix and "[Department]" suffix used for the calendar chip */
const plainTitle = (e: CalendarEvent) => String(e.title).replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s*\[[^\]]+\]\s*$/, "");

interface Props {
  summary: PlannerSummary;
  month: Date;
  onOpen: (event: CalendarEvent) => void;
  /** "list" fills the sidebar; "strip" is the compact row shown where the sidebar is hidden */
  layout: "list" | "strip";
}

export const CalendarSummary = ({ summary, month, onOpen, layout }: Props) => {
  const m = format(month, "MMMM");
  const rows: { key: string; label: string; value: number; icon: typeof ListTodo; tone: string }[] = [
    { key: "today", label: "Due today", value: summary.today, icon: CalendarCheck2, tone: "text-sky-300" },
    { key: "month", label: `Tasks in ${m}`, value: summary.monthTotal, icon: ListTodo, tone: "text-white/80" },
    { key: "done", label: "Completed", value: summary.completed, icon: CheckCircle2, tone: "text-emerald-300" },
    { key: "pending", label: "Pending", value: summary.pending, icon: CircleDashed, tone: "text-amber-300" },
    { key: "overdue", label: "Overdue", value: summary.overdue, icon: AlertTriangle, tone: summary.overdue ? "text-red-300" : "text-white/40" },
    { key: "plans", label: `Plans in ${m}`, value: summary.plans, icon: ClipboardList, tone: "text-blue-300" },
  ];

  const next = summary.next;
  const nextBlock = (
    <button
      type="button"
      disabled={!next}
      onClick={() => next && onOpen(next)}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition-colors",
        next ? "hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40" : "cursor-default"
      )}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
        <Flag className="h-3 w-3 text-amber-300" /> Next task
      </span>
      {next ? (
        <>
          <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-snug text-white">{plainTitle(next)}</span>
          <span className="mt-0.5 block text-xs text-white/50">{relativeDay(next.start)}</span>
        </>
      ) : (
        <span className="mt-1 block text-xs text-white/50">Nothing coming up</span>
      )}
    </button>
  );

  if (layout === "strip") {
    return (
      <div className="flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Calendar summary">
        <div className="w-56 shrink-0">{nextBlock}</div>
        {rows.slice(0, 5).map(({ key, label, value, tone }) => (
          <div key={key} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className={cn("block text-lg font-bold leading-none tabular-nums", tone)}>{value}</span>
            <span className="mt-1 block whitespace-nowrap text-[10px] uppercase tracking-wide text-white/45">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Calendar summary" className="space-y-3 pb-2 text-white">
      {nextBlock}
      <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.03]">
        {rows.map(({ key, label, value, icon: Icon, tone }) => (
          <li key={key} className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-white/75">
              <Icon className={cn("h-4 w-4 shrink-0", tone)} />
              <span className="truncate">{label}</span>
            </span>
            <span className={cn("text-sm font-semibold tabular-nums", tone)}>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
