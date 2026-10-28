import { useMemo, useState } from "react";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { postDate } from "@/lib/postit/schedule";
import type { PostitPost } from "@/lib/postit/types";
import { PostChip } from "./PostCard";

const WEEK = { weekStartsOn: 1 as const };
const keyOf = (d: Date) => format(d, "yyyy-MM-dd");

export const calendarRange = (view: "month" | "week", cursor: Date) =>
  view === "month"
    ? { from: startOfWeek(startOfMonth(cursor), WEEK), to: endOfWeek(endOfMonth(cursor), WEEK) }
    : { from: startOfWeek(cursor, WEEK), to: endOfWeek(cursor, WEEK) };

interface Props {
  view: "month" | "week";
  cursor: Date;
  posts: PostitPost[];
  selectedDay: Date | null;
  clientLabel?: (p: PostitPost) => string | undefined;
  canDrag: (p: PostitPost) => boolean;
  onSelectDay: (d: Date) => void;
  onCreate: (d: Date) => void;
  onOpenPost: (p: PostitPost) => void;
  onMove: (postId: string, day: Date) => void;
}

/** Month or week grid. Drag a post onto another day to reschedule it (time of day is kept). */
export const PostCalendar = ({ view, cursor, posts, selectedDay, clientLabel, canDrag, onSelectDay, onCreate, onOpenPost, onMove }: Props) => {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const { from, to } = calendarRange(view, cursor);
  const days = useMemo(() => eachDayOfInterval({ start: from, end: to }), [from, to]);

  const byDay = useMemo(() => {
    const map = new Map<string, PostitPost[]>();
    for (const p of posts) {
      const d = postDate(p);
      if (!d) continue;
      const k = keyOf(d);
      (map.get(k) ?? map.set(k, []).get(k)!).push(p);
    }
    map.forEach((list) => list.sort((a, b) => +new Date(a.scheduled_at ?? 0) - +new Date(b.scheduled_at ?? 0)));
    return map;
  }, [posts]);

  const maxChips = view === "week" ? 50 : 3;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.04]">
        {days.slice(0, 7).map((d) => (
          <div key={d.toISOString()} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/50 sm:text-[11px]">{format(d, "EEE")}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const k = keyOf(day);
          const list = byDay.get(k) ?? [];
          const outside = view === "month" && !isSameMonth(day, cursor);
          const selected = selectedDay && isSameDay(day, selectedDay);
          return (
            <div
              key={k}
              role="gridcell"
              tabIndex={0}
              aria-label={`${format(day, "EEEE d MMMM")}, ${list.length} post${list.length === 1 ? "" : "s"}`}
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onCreate(day)}
              onKeyDown={(e) => { if (e.key === "Enter") onSelectDay(day); }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(k); }}
              onDragLeave={() => setDragOver((v) => (v === k ? null : v))}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); const id = e.dataTransfer.getData("text/postit"); if (id) onMove(id, day); }}
              className={cn(
                "group relative cursor-pointer border-b border-r border-white/[0.07] p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-1.5",
                view === "month" ? "min-h-[64px] sm:min-h-[112px]" : "min-h-[220px]",
                (i + 1) % 7 === 0 && "border-r-0",
                outside && "bg-black/20 text-white/30",
                selected && "bg-primary/10",
                dragOver === k && "bg-primary/20 ring-2 ring-inset ring-primary",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold sm:text-xs", isToday(day) ? "bg-primary text-primary-foreground" : outside ? "text-white/30" : "text-white/75")}>{format(day, "d")}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCreate(day); }}
                  aria-label={`New post on ${format(day, "d MMMM")}`}
                  className="hidden h-5 w-5 items-center justify-center rounded text-white/40 opacity-0 hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
                ><Plus className="h-3.5 w-3.5" /></button>
              </div>
              {/* Desktop: post chips */}
              <div className="mt-1 hidden space-y-1 sm:block">
                {list.slice(0, maxChips).map((p) => <PostChip key={p.id} post={p} showClient={clientLabel?.(p)} onOpen={onOpenPost} draggable={canDrag(p)} />)}
                {list.length > maxChips && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onSelectDay(day); }} className="w-full rounded px-1.5 py-0.5 text-left text-[11px] font-semibold text-white/55 hover:bg-white/10 hover:text-white">+{list.length - maxChips} more</button>
                )}
              </div>
              {/* Mobile: dots */}
              {list.length > 0 && (
                <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden="true">
                  {list.slice(0, 6).map((p) => <span key={p.id} className="h-1.5 w-1.5 rounded-full bg-primary" />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const nextCursor = (view: "month" | "week", cursor: Date, dir: 1 | -1) =>
  view === "month" ? new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1) : addDays(cursor, 7 * dir);
