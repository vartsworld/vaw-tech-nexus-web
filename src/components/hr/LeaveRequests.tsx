import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, formatDistanceToNow, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { AlertCircle, CalendarCheck, CalendarDays, Check, Inbox, Loader2, RefreshCw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaveRow {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string | null;
  created_at: string | null;
}

interface StaffLite {
  user_id: string;
  full_name: string | null;
  role: string | null;
}

const STATUS = {
  pending: { label: "Pending", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  approved: { label: "Approved", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "Rejected", tone: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
} as const;
type StatusKey = keyof typeof STATUS;
const statusOf = (s: string | null): StatusKey => (s === "approved" || s === "rejected" ? s : "pending");

/** Approve or reject staff leave applications, and see who is away today. */
const LeaveRequests = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [staff, setStaff] = useState<Record<string, StaffLite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | StatusKey>("pending");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [leaveRes, staffRes] = await Promise.all([
      (supabase as any).from("staff_leave_requests").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("staff_profiles").select("user_id, full_name, role"),
    ]);
    if (leaveRes.error) {
      console.error(leaveRes.error);
      setError("Couldn't load leave requests. Check your connection or permissions.");
    } else {
      setRows((leaveRes.data ?? []) as LeaveRow[]);
      setError(null);
    }
    const map: Record<string, StaffLite> = {};
    (staffRes.data ?? []).forEach((s: any) => (map[s.user_id] = s));
    setStaff(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`hr-leave-${Math.random().toString(36).slice(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_leave_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const decide = async (row: LeaveRow, next: "approved" | "rejected") => {
    setBusyId(row.id);
    const { error: err } = await (supabase as any).from("staff_leave_requests").update({ status: next, updated_at: new Date().toISOString() }).eq("id", row.id);
    setBusyId(null);
    if (err) {
      console.error(err);
      toast({ title: "Couldn't save your decision", description: "You may not have permission to update leave requests.", variant: "destructive" });
      return;
    }
    setRows((list) => list.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    toast({ title: next === "approved" ? "Leave approved" : "Leave rejected", description: staff[row.user_id]?.full_name ?? "Staff member" });
  };

  const today = startOfDay(new Date());
  const awayToday = useMemo(
    () => rows.filter((r) => statusOf(r.status) === "approved" && isWithinInterval(today, { start: startOfDay(parseISO(r.start_date)), end: startOfDay(parseISO(r.end_date)) })),
    [rows, today]
  );

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((r) => statusOf(r.status) === "pending").length,
    approved: rows.filter((r) => statusOf(r.status) === "approved").length,
    rejected: rows.filter((r) => statusOf(r.status) === "rejected").length,
  }), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && statusOf(r.status) !== filter) return false;
      if (!q) return true;
      return [staff[r.user_id]?.full_name, r.leave_type, r.reason].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, filter, query, staff]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Leave requests</h2>
          <p className="text-sm text-muted-foreground">Review leave applications from staff and keep track of who is away.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-white/10 bg-card/70">
          <CardContent className="space-y-1 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Waiting for decision</p>
            <p className={cn("text-2xl font-black tabular-nums", counts.pending ? "text-amber-400" : "")}>{loading ? "–" : counts.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/70 sm:col-span-2">
          <CardContent className="space-y-2 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <CalendarCheck className="h-3.5 w-3.5" /> Away today
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : awayToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everyone is available today.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {awayToday.map((r) => (
                  <Badge key={r.id} variant="outline" className="border-white/15 text-xs">
                    {staff[r.user_id]?.full_name ?? "Staff"} · until {format(parseISO(r.end_date), "d MMM")}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/70">
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, leave type or reason…" className="pl-9" aria-label="Search leave requests" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by status">
            {([["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["all", "All"]] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  filter === value ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                )}
              >
                {label} <span className="ml-1 opacity-70">{counts[value]}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={() => load()}>Try again</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-transparent">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">{filter === "pending" && !query ? "No leave requests are waiting" : "No leave requests match"}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => {
            const s = STATUS[statusOf(r.status)];
            const days = differenceInCalendarDays(parseISO(r.end_date), parseISO(r.start_date)) + 1;
            const person = staff[r.user_id];
            const pending = statusOf(r.status) === "pending";
            return (
              <li key={r.id}>
                <Card className={cn("border-white/10 bg-card/70", pending && "border-l-4 border-l-amber-500")}>
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">{person?.full_name ?? "Unknown staff member"}</h3>
                      <Badge variant="outline" className={cn("border text-[11px]", s.tone)}>{s.label}</Badge>
                      <Badge variant="outline" className="border-white/15 text-[11px] capitalize text-muted-foreground">{r.leave_type.replace(/_/g, " ")}</Badge>
                      {r.created_at && <span className="ml-auto text-xs text-muted-foreground">applied {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>}
                    </div>
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{format(parseISO(r.start_date), "EEE, d MMM yyyy")}</span>
                      {r.end_date !== r.start_date && <><span className="text-muted-foreground">to</span><span className="font-medium">{format(parseISO(r.end_date), "EEE, d MMM yyyy")}</span></>}
                      <span className="text-muted-foreground">· {days} day{days === 1 ? "" : "s"}</span>
                    </p>
                    {r.reason && <p className="rounded-lg bg-black/20 p-3 text-sm text-muted-foreground">{r.reason}</p>}
                    {pending ? (
                      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                        <Button size="sm" onClick={() => decide(r, "approved")} disabled={busyId === r.id} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500">
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => decide(r, "rejected")} disabled={busyId === r.id} className="gap-1.5 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="border-t border-white/10 pt-3">
                        <Button size="sm" variant="ghost" onClick={() => decide(r, statusOf(r.status) === "approved" ? "rejected" : "approved")} disabled={busyId === r.id} className="text-xs text-muted-foreground">
                          Change to {statusOf(r.status) === "approved" ? "rejected" : "approved"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LeaveRequests;
