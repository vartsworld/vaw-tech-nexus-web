import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import {
  Activity, AlertTriangle, CheckCircle2, Database, Download, FileSpreadsheet, KeyRound, Loader2, Moon, RefreshCw, ShieldCheck, UserX, Wifi, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const db = supabase as any;

/* ───────────── Security & access ───────────── */
const SecurityPanel = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = subDays(new Date(), 7).toISOString().split("T")[0];
      const [s, a] = await Promise.all([
        db.from("staff_profiles").select("id,user_id,full_name,username,email,role,application_status,login_attempts,last_login_attempt,first_time_passcode,passcode_used,is_emoji_password,created_at,hire_date,dismissed_at,dismissal_reason"),
        db.from("staff_attendance").select("user_id").gte("date", since),
      ]);
      let rows = s.data;
      if (s.error) {
        // The dismissal migration may not be applied yet: retry without its columns
        const retry = await db.from("staff_profiles").select("id,user_id,full_name,username,email,role,application_status,login_attempts,last_login_attempt,first_time_passcode,passcode_used,is_emoji_password,created_at,hire_date");
        rows = retry.data;
      }
      setStaff(rows || []);
      setRecent(new Set((a.data || []).map((r: any) => r.user_id)));
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    const current = staff.filter((m) => m.application_status !== "dismissed");
    return {
      privileged: current.filter((m) => ["hr", "admin", "super_admin", "manager"].includes(m.role)),
      failed: current.filter((m) => (m.login_attempts || 0) > 0).sort((a, b) => (b.login_attempts || 0) - (a.login_attempts || 0)),
      inactive: current.filter((m) => {
        const joined = new Date(m.hire_date || m.created_at || 0).getTime();
        const login = m.last_login_attempt ? new Date(m.last_login_attempt).getTime() : 0;
        return !recent.has(m.user_id) && login < cutoff && joined < cutoff;
      }),
      noLogin: current.filter((m) => !m.is_emoji_password && !m.first_time_passcode),
      pendingSetup: current.filter((m) => m.first_time_passcode && !m.passcode_used && !m.is_emoji_password),
      dismissed: staff.filter((m) => m.application_status === "dismissed").sort((a, b) => +new Date(b.dismissed_at || 0) - +new Date(a.dismissed_at || 0)),
    };
  }, [staff, recent]);

  if (loading) return <Skeleton className="h-64 rounded-2xl" />;

  const Row = ({ m, extra }: { m: any; extra?: string }) => (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="min-w-0"><span className="block truncate font-medium">{m.full_name}</span><span className="block truncate text-xs text-muted-foreground">@{m.username} · {m.email}</span></span>
      <span className="shrink-0 text-right text-xs text-muted-foreground">{extra}</span>
    </li>
  );

  const Section = ({ title, icon: Icon, tone, items, empty, render }: any) => (
    <Card className="rounded-2xl border-white/10 bg-card/70">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm"><Icon className={cn("h-4 w-4", tone)} /> {title}<Badge variant="outline" className="ml-1 border-white/15">{items.length}</Badge></CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {items.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{empty}</p> : <ul className="max-h-64 divide-y divide-white/10 overflow-y-auto">{items.map((m: any) => <Row key={m.id} m={m} extra={render(m)} />)}</ul>}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Section title="Accounts with elevated access" icon={ShieldCheck} tone="text-purple-400" items={groups.privileged} empty="None." render={(m: any) => m.role?.replace("_", " ")} />
      <Section title="Failed sign-in attempts" icon={AlertTriangle} tone="text-orange-400" items={groups.failed} empty="No failed attempts on record." render={(m: any) => `${m.login_attempts} attempt${m.login_attempts === 1 ? "" : "s"}${m.last_login_attempt ? ` · ${formatDistanceToNow(new Date(m.last_login_attempt), { addSuffix: true })}` : ""}`} />
      <Section title="Inactive for 7+ days" icon={Moon} tone="text-amber-400" items={groups.inactive} empty="Everyone has been active this week." render={(m: any) => m.role} />
      <Section title="First passcode not used yet" icon={KeyRound} tone="text-sky-400" items={groups.pendingSetup} empty="All passcodes have been used." render={(m: any) => `code ${m.first_time_passcode}`} />
      <Section title="No sign-in method set" icon={XCircle} tone="text-rose-400" items={groups.noLogin} empty="Everyone can sign in." render={() => "Reset the passcode in Staff Directory"} />
      <Section title="Dismissed employees" icon={UserX} tone="text-red-400" items={groups.dismissed} empty="Nobody has been dismissed." render={(m: any) => (
        <span className="block max-w-[14rem] text-right">{m.dismissed_at ? format(new Date(m.dismissed_at), "d MMM yyyy") : ""}{m.dismissal_reason ? <span className="block truncate" title={m.dismissal_reason}>{m.dismissal_reason}</span> : null}</span>
      )} />
    </div>
  );
};

/* ───────────── Activity & audit ───────────── */
const ActivityPanel = () => {
  const [source, setSource] = useState("activity");
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const cfg: Record<string, { table: string; order: string }> = {
      activity: { table: "user_activity_log", order: "created_at" },
      audit: { table: "super_admin_audit_logs", order: "created_at" },
      coins: { table: "user_coin_transactions", order: "created_at" },
      api: { table: "api_logs", order: "created_at" },
    };
    const c = cfg[source];
    const [r, n] = await Promise.all([
      db.from(c.table).select("*").order(c.order, { ascending: false }).limit(100),
      db.from("staff_profiles").select("user_id,full_name"),
    ]);
    setRows(r.data || []);
    setNames(Object.fromEntries((n.data || []).map((p: any) => [p.user_id, p.full_name])));
    setLoading(false);
  }, [source]);

  useEffect(() => { load(); }, [load]);

  const describe = (r: any) => {
    switch (source) {
      case "activity": return { who: names[r.user_id] || "Unknown", what: String(r.activity_type || "").replace(/_/g, " "), extra: r.points_earned ? `+${r.points_earned} pts` : r.duration_minutes ? `${r.duration_minutes} min` : "" };
      case "audit": return { who: names[r.admin_id] || "Admin", what: String(r.action_type || "").replace(/_/g, " "), extra: r.ip_address || "" };
      case "coins": return { who: names[r.user_id] || "Unknown", what: `${r.transaction_type} · ${r.reason || r.category || r.source_type || ""}`, extra: `${r.coins > 0 ? "+" : ""}${r.coins} coins` };
      default: return { who: r.method, what: r.path, extra: `${r.status} · ${r.duration_ms ?? "–"} ms` };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={source} onValueChange={setSource}>
          <TabsList className="h-auto flex-wrap bg-white/5">
            <TabsTrigger value="activity">Staff activity</TabsTrigger>
            <TabsTrigger value="audit">Admin audit</TabsTrigger>
            <TabsTrigger value="coins">Coin ledger</TabsTrigger>
            <TabsTrigger value="api">API calls</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 border-white/10 bg-white/5"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh</Button>
      </div>
      <Card className="rounded-2xl border-white/10 bg-card/70">
        <CardContent className="p-0">
          {loading ? <div className="p-4"><Skeleton className="h-48" /></div> : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map((r) => {
                const d = describe(r);
                const when = r.created_at || r.timestamp;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0"><span className="block truncate font-medium">{d.who}</span><span className="block truncate text-xs capitalize text-muted-foreground">{d.what}</span></span>
                    <span className="shrink-0 text-right text-xs text-muted-foreground"><span className="block">{d.extra}</span>{when && <time title={format(new Date(when), "PPpp")}>{formatDistanceToNow(new Date(when), { addSuffix: true })}</time>}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ───────────── Data export ───────────── */
const EXPORTS = [
  { key: "staff_profiles", label: "Staff", note: "Profiles without passcodes or emoji passwords", omit: ["first_time_passcode", "emoji_password", "login_attempts", "kyc_selfie_url", "govt_id_number"], dated: false },
  { key: "staff_attendance", label: "Attendance", note: "Check-ins within the date range", omit: [], dated: "date" },
  { key: "staff_tasks", label: "Tasks", note: "Created within the date range", omit: [], dated: "created_at" },
  { key: "staff_leave_requests", label: "Leave requests", note: "Created within the date range", omit: [], dated: "created_at" },
  { key: "inquiries", label: "Inquiries and pricing requests", note: "Received within the date range", omit: [], dated: "created_at" },
  { key: "clients", label: "Clients", note: "All client records", omit: [], dated: false },
];

const ExportPanel = () => {
  const { toast } = useToast();
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (e: (typeof EXPORTS)[number]) => {
    setBusy(e.key);
    try {
      let q = db.from(e.key).select("*").limit(10000);
      if (e.dated) q = q.gte(e.dated, from).lte(e.dated, e.dated === "date" ? to : `${to}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      if (!downloadCsv(`${e.key}-${format(new Date(), "yyyy-MM-dd")}.csv`, data || [], e.omit)) {
        toast({ title: "Nothing to export", description: "No rows match that range." });
      } else {
        toast({ title: "Export ready", description: `${data.length} rows saved as CSV.` });
      }
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid max-w-md grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="exp-from">From</Label><Input id="exp-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="exp-to">To</Label><Input id="exp-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {EXPORTS.map((e) => (
          <Card key={e.key} className="rounded-2xl border-white/10 bg-card/70">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="h-4 w-4 text-emerald-400" />{e.label}</span>
                <span className="block text-xs text-muted-foreground">{e.note}{e.dated ? "" : " (range ignored)"}</span>
              </span>
              <Button size="sm" variant="outline" className="gap-2 border-white/10 bg-white/5" disabled={!!busy} onClick={() => run(e)}>
                {busy === e.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ───────────── System health ───────────── */
const TABLES = ["staff_profiles", "staff_attendance", "staff_tasks", "staff_leave_requests", "inquiries", "clients", "client_projects", "pricing_packages", "client_error_logs", "chat_messages"];

const HealthPanel = () => {
  const [results, setResults] = useState<{ table: string; ok: boolean; count: number | null; ms: number; error?: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [sw, setSw] = useState<string>("checking…");

  const check = useCallback(async () => {
    setRunning(true);
    const out = await Promise.all(TABLES.map(async (table) => {
      const t0 = performance.now();
      const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
      return { table, ok: !error, count: count ?? null, ms: Math.round(performance.now() - t0), error: error?.message };
    }));
    setResults(out);
    setRunning(false);
  }, []);

  useEffect(() => {
    check();
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    navigator.serviceWorker?.getRegistrations().then((r) => setSw(r.length ? `${r.length} active` : "none")).catch(() => setSw("unavailable"));
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [check]);

  const clearCaches = async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    const regs = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((regs || []).map((r) => r.unregister()));
    window.location.reload();
  };

  const failing = results.filter((r) => !r.ok);
  const avg = results.length ? Math.round(results.reduce((t, r) => t + r.ms, 0) / results.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Connection", value: online ? "Online" : "Offline", ok: online, Icon: Wifi },
          { label: "Database", value: running ? "Checking…" : failing.length ? `${failing.length} issue${failing.length > 1 ? "s" : ""}` : "Healthy", ok: !failing.length, Icon: Database },
          { label: "Avg. response", value: `${avg} ms`, ok: avg < 1500, Icon: Activity },
          { label: "Service worker", value: sw, ok: true, Icon: ShieldCheck },
        ].map(({ label, value, ok, Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-card/70 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
            <p className={cn("mt-1 text-lg font-bold", ok ? "text-emerald-400" : "text-amber-400")}>{value}</p>
          </div>
        ))}
      </div>
      <Card className="rounded-2xl border-white/10 bg-card/70">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
          <div><CardTitle className="text-sm">Tables the dashboard depends on</CardTitle><CardDescription className="text-xs">A red row means HR cannot read that table: check permissions or the migration.</CardDescription></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 border-white/10 bg-white/5" onClick={check} disabled={running}><RefreshCw className={cn("h-4 w-4", running && "animate-spin")} /> Re-check</Button>
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5" onClick={clearCaches}>Clear app cache</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-white/10">
            {results.map((r) => (
              <li key={r.table} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {r.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                  <span className="truncate font-mono text-xs">{r.table}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{r.ok ? `${r.count ?? "?"} rows · ${r.ms} ms` : r.error}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminConsole = () => (
  <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Admin Console</h1>
      <p className="text-sm text-muted-foreground">Security checks, audit trails, data exports and system health: the things you do not need every day.</p>
    </div>
    <Tabs defaultValue="security">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-white/5 p-1 sm:w-auto">
        <TabsTrigger value="security">Security & access</TabsTrigger>
        <TabsTrigger value="activity">Activity & audit</TabsTrigger>
        <TabsTrigger value="export">Data export</TabsTrigger>
        <TabsTrigger value="health">System health</TabsTrigger>
      </TabsList>
      <TabsContent value="security" className="mt-5"><SecurityPanel /></TabsContent>
      <TabsContent value="activity" className="mt-5"><ActivityPanel /></TabsContent>
      <TabsContent value="export" className="mt-5"><ExportPanel /></TabsContent>
      <TabsContent value="health" className="mt-5"><HealthPanel /></TabsContent>
    </Tabs>
  </div>
);

export default AdminConsole;
