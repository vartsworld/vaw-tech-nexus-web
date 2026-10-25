import { useMemo } from "react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import {
  AlertTriangle, ArrowRight, CalendarOff, CheckCircle2, CheckSquare, ClipboardList, Clock, Inbox, LifeBuoy, Megaphone, MessageSquare, UserCheck, UserPlus, Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHRBadges } from "@/hooks/useHRBadges";
import { useInquiries } from "@/hooks/useInquiries";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { formatPrice } from "@/lib/pricing";
import { parseInquiry } from "@/lib/inquiryParser";
import { cn } from "@/lib/utils";

interface HROverviewProps {
  firstName?: string;
  onNavigate: (room: string) => void;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const HROverview = ({ firstName, onNavigate }: HROverviewProps) => {
  const today = new Date().toISOString().split("T")[0];
  const weekStart = subDays(new Date(), 6).toISOString().split("T")[0];
  const badges = useHRBadges();
  const { rows: inquiryRows } = useInquiries();

  const { data: staff } = useRealtimeQuery({ queryKey: ["hr-ov-staff"], table: "staff_profiles", select: "id, user_id, full_name, role" });
  const { data: weekAttendance } = useRealtimeQuery({
    queryKey: ["hr-ov-attendance-week", weekStart],
    table: "staff_attendance",
    filter: `date=gte.${weekStart}`,
    select: "id, user_id, date, is_late",
  });
  const { data: tasks } = useRealtimeQuery({
    queryKey: ["hr-ov-tasks"],
    table: "staff_tasks",
    select: "id, status, title, created_at, due_date",
  });
  const { data: departments } = useRealtimeQuery({ queryKey: ["hr-ov-departments"], table: "departments", select: "id" });

  const totalStaff = Array.isArray(staff) ? staff.length : 0;

  const att = useMemo(() => {
    const rows: any[] = Array.isArray(weekAttendance) ? weekAttendance : [];
    const byDate = new Map<string, Set<string>>();
    rows.forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, new Set());
      byDate.get(r.date)!.add(r.user_id);
    });
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = d.toISOString().split("T")[0];
      const present = byDate.get(key)?.size ?? 0;
      return { key, day: format(d, "EEE"), present, pct: totalStaff ? Math.round((present / totalStaff) * 100) : 0 };
    }).filter((d) => d.present > 0 || d.key === today); // skip days nobody worked (weekends/holidays)
    const todayRows = rows.filter((r) => r.date === today);
    return { days, present: byDate.get(today)?.size ?? 0, late: todayRows.filter((r) => r.is_late).length };
  }, [weekAttendance, totalStaff, today]);

  const taskStats = useMemo(() => {
    const list: any[] = Array.isArray(tasks) ? tasks : [];
    return {
      active: list.filter((t) => t.status === "pending" || t.status === "in_progress").length,
      done: list.filter((t) => t.status === "completed").length,
      latest: [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    };
  }, [tasks]);

  const latestRequests = useMemo(
    () => inquiryRows.slice(0, 5).map(parseInquiry),
    [inquiryRows],
  );

  const attention = [
    { id: "pricing-requests", label: "New pricing requests", count: badges.pricing, icon: Inbox, tone: "text-blue-400 bg-blue-500/10" },
    { id: "inquiries", label: "New website messages", count: badges.inquiries, icon: MessageSquare, tone: "text-sky-400 bg-sky-500/10" },
    { id: "market-enquiries", label: "New marketing-site enquiries", count: badges.marketEnquiries, icon: Megaphone, tone: "text-teal-400 bg-teal-500/10" },
    { id: "leave", label: "Leave requests to review", count: badges.leave, icon: CalendarOff, tone: "text-amber-400 bg-amber-500/10" },
    { id: "applications", label: "Pending team applications", count: badges.applications, icon: UserPlus, tone: "text-purple-400 bg-purple-500/10" },
    { id: "support", label: "Open support tickets", count: badges.support, icon: LifeBuoy, tone: "text-rose-400 bg-rose-500/10" },
    { id: "tasks", label: "Overdue tasks", count: badges.overdueTasks, icon: AlertTriangle, tone: "text-orange-400 bg-orange-500/10" },
  ];
  const pending = attention.filter((a) => a.count > 0);

  const kpis = [
    { label: "Staff", value: totalStaff, hint: `${departments?.length ?? 0} departments`, icon: Users, tone: "text-blue-400 bg-blue-500/10", room: "staff" },
    {
      label: "Present today",
      value: totalStaff ? `${att.present}/${totalStaff}` : att.present,
      hint: att.late ? `${att.late} arrived late` : "No late arrivals",
      icon: UserCheck,
      tone: "text-emerald-400 bg-emerald-500/10",
      room: "attendance",
    },
    { label: "Active tasks", value: taskStats.active, hint: `${taskStats.done} completed`, icon: CheckSquare, tone: "text-amber-400 bg-amber-500/10", room: "tasks" },
    { label: "New requests", value: badges.pricing + badges.inquiries, hint: `${badges.pricing} pricing · ${badges.inquiries} ${badges.inquiries === 1 ? "message" : "messages"}`, icon: Inbox, tone: "text-violet-400 bg-violet-500/10", room: "pricing-requests" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pending.length ? "Here's what is waiting for you today." : "Nothing is waiting for you right now."}
        </p>
      </div>

      {/* Needs attention */}
      <Card className="rounded-2xl border-white/10 bg-card/70">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ClipboardList className="h-5 w-5 text-primary" /> Needs your attention
            {pending.length > 0 && <Badge className="ml-1 bg-primary/15 text-primary hover:bg-primary/15">{pending.reduce((t, a) => t + a.count, 0)}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {pending.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>You're all caught up. New requests, leave and applications will show up here as they arrive.</span>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {pending.map(({ id, label, count, icon: Icon, tone }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tone)}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xl font-black leading-none tabular-nums">{count}</span>
                      <span className="block truncate text-xs text-muted-foreground">{label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, hint, icon: Icon, tone, room }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(room)}
            className="rounded-2xl border border-white/10 bg-card/70 p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
              <span className={cn("rounded-lg p-2", tone)}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight tabular-nums sm:text-3xl">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance chart */}
        <Card className="overflow-hidden rounded-2xl border-white/10 bg-card/70 lg:col-span-2">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Clock className="h-5 w-5 text-primary" /> Attendance, last 7 days</CardTitle>
            <CardDescription className="text-xs">Share of staff who checked in each working day</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {totalStaff === 0 || att.days.every((d) => d.present === 0) ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No check-ins recorded this week yet.</p>
            ) : (
              <div className="h-[220px] w-full sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={att.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hrAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={(v: number, _n, p: any) => [`${v}% (${p.payload.present} of ${totalStaff})`, "Present"]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#fff" }}
                    />
                    <Area type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2.5} fill="url(#hrAttendance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest requests */}
        <Card className="flex flex-col rounded-2xl border-white/10 bg-card/70">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Inbox className="h-5 w-5 text-blue-400" /> Latest requests</CardTitle>
            <CardDescription className="text-xs">Newest from the website</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {latestRequests.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {latestRequests.map((p) => (
                  <li key={p.row.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(p.kind === "general" ? "inquiries" : "pricing-requests")}
                      className="flex w-full items-start justify-between gap-3 p-3.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{p.row.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.kind === "general" ? "Website message" : p.packageName || p.requestType}
                          {p.row.created_at && <> · {formatDistanceToNow(new Date(p.row.created_at), { addSuffix: true })}</>}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        {p.total !== null && <span className="block text-sm font-bold tabular-nums">{formatPrice(p.total)}</span>}
                        {p.status === "new" && <span className="text-[11px] font-semibold text-blue-400">New</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Common jobs</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { id: "pricing-requests", label: "Pricing requests", icon: Inbox },
            { id: "leave", label: "Leave requests", icon: CalendarOff },
            { id: "staff", label: "Manage staff", icon: Users },
            { id: "tasks", label: "Task board", icon: CheckSquare },
            { id: "applications", label: "Applications", icon: UserPlus },
            { id: "pricing", label: "Pricing & coupons", icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="outline"
              onClick={() => onNavigate(id)}
              className="h-14 flex-col gap-1 rounded-xl border-white/10 bg-white/5 text-xs font-semibold hover:bg-white/10"
            >
              <Icon className="h-4 w-4 text-primary" /> {label}
            </Button>
          ))}
        </div>
      </div>

      {taskStats.latest.length > 0 && (
        <Card className="rounded-2xl border-white/10 bg-card/70">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Recently added tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ul className="divide-y divide-white/10">
              {taskStats.latest.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate font-medium">{t.title}</span>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">{String(t.status || "").replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HROverview;
