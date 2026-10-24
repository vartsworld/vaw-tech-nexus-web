import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Briefcase, Building2, CheckSquare, User, ExternalLink, CircleHelp } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Area, AreaChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const PALETTE = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#fb7185", "#2dd4bf", "#fb923c", "#94a3b8"];

const TONES: Record<string, string> = {
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  gray: "bg-white/10 text-white/70 border-white/15",
};

const toneFor = (text: string, tone?: string) => {
  if (tone && TONES[tone]) return TONES[tone];
  const t = (text || "").toLowerCase();
  if (/(active|approved|completed|paid|done|present|live)/.test(t)) return TONES.green;
  if (/(overdue|rejected|dismissed|inactive|failed|late|urgent|absent)/.test(t)) return TONES.red;
  if (/(pending|progress|review|new|hold|high)/.test(t)) return TONES.amber;
  return TONES.gray;
};

const num = (v: any) => (typeof v === "number" ? v : Number(v) || 0);

/* ---------------------------------- chart ---------------------------------- */

export interface ChartSpec {
  type?: "bar" | "line" | "area" | "pie" | "donut";
  title?: string;
  subtitle?: string;
  data: Record<string, any>[];
  xKey?: string;
  series?: { key: string; label?: string }[];
  unit?: string;
}

export const EmmaChart = ({ spec }: { spec: ChartSpec }) => {
  const data = (spec.data || []).map((d) => ({ ...d }));
  if (!data.length) return <BlockError text="This chart has no data." />;
  const xKey = spec.xKey || "label";
  const series = spec.series?.length ? spec.series : [{ key: "value", label: spec.unit || "Value" }];
  const type = spec.type || "bar";
  const axis = { stroke: "rgba(255,255,255,0.45)", fontSize: 11, tickLine: false, axisLine: false } as const;
  const tooltip = {
    contentStyle: { background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12, color: "#fff" },
    labelStyle: { color: "#fff" }, itemStyle: { color: "#e2e8f0" },
  };
  return (
    <figure className="my-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      {(spec.title || spec.subtitle) && (
        <figcaption className="mb-2 px-1">
          {spec.title && <p className="text-sm font-semibold text-white">{spec.title}</p>}
          {spec.subtitle && <p className="text-xs text-white/50">{spec.subtitle}</p>}
        </figcaption>
      )}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" || type === "donut" ? (
            <PieChart>
              <Pie data={data} dataKey={series[0].key} nameKey={xKey} innerRadius={type === "donut" ? "55%" : 0} outerRadius="85%" paddingAngle={2} stroke="none">
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip {...tooltip} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
            </PieChart>
          ) : type === "line" ? (
            <LineChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey={xKey} {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tooltip} />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 2.5 }} />)}
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey={xKey} {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tooltip} />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.18} strokeWidth={2} />)}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey={xKey} {...axis} interval={0} tickFormatter={(v: string) => (String(v).length > 10 ? String(v).slice(0, 9) + "…" : v)} />
              <YAxis {...axis} allowDecimals={false} /><Tooltip {...tooltip} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.label || s.key} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]}>
                  {series.length === 1 && data.map((_, j) => <Cell key={j} fill={PALETTE[j % PALETTE.length]} />)}
                </Bar>
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
};

/* ----------------------------------- card ----------------------------------- */

export interface CardSpec {
  kind?: "staff" | "client" | "project" | "task" | "generic";
  title: string;
  subtitle?: string;
  image?: string;
  badges?: (string | { text: string; tone?: string })[];
  fields?: { label: string; value: string | number }[];
  progress?: number;
  actions?: { label: string; href: string }[];
}

const KindIcon = ({ kind }: { kind?: string }) => {
  const c = "h-5 w-5 text-sky-300";
  if (kind === "client") return <Building2 className={c} />;
  if (kind === "project") return <Briefcase className={c} />;
  if (kind === "task") return <CheckSquare className={c} />;
  return <User className={c} />;
};

export const EmmaCard = ({ spec }: { spec: CardSpec }) => {
  const isPerson = spec.kind === "staff";
  const href = (h: string) => (/^(\/|https?:\/\/)/.test(h) ? h : "#");
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
      <div className="flex items-start gap-3">
        {isPerson ? (
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={spec.image} />
            <AvatarFallback className="bg-slate-700 font-semibold text-white">{(spec.title || "?").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-400/20"><KindIcon kind={spec.kind} /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{spec.title}</p>
          {spec.subtitle && <p className="truncate text-xs text-white/55">{spec.subtitle}</p>}
          {!!spec.badges?.length && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {spec.badges.map((b, i) => {
                const text = typeof b === "string" ? b : b.text;
                const tone = typeof b === "string" ? undefined : b.tone;
                return <span key={i} className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", toneFor(text, tone))}>{text}</span>;
              })}
            </div>
          )}
        </div>
      </div>
      {typeof spec.progress === "number" && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-white/50"><span>Progress</span><span>{Math.round(spec.progress)}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(0, Math.min(100, spec.progress))}%` }} /></div>
        </div>
      )}
      {!!spec.fields?.length && (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3">
          {spec.fields.map((f, i) => (
            <div key={i} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wide text-white/40">{f.label}</dt>
              <dd className="truncate text-xs font-medium text-white/90">{String(f.value ?? "—")}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!spec.actions?.length && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          {spec.actions.map((a, i) => (
            <a key={i} href={href(a.href)} className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20">
              {a.label}<ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export const EmmaCards = ({ specs }: { specs: CardSpec[] }) => (
  <div className={cn("my-3 grid gap-2.5", specs.length > 1 ? "sm:grid-cols-2" : "")}>{specs.map((s, i) => <EmmaCard key={i} spec={s} />)}</div>
);

/* ----------------------------------- stats ---------------------------------- */

export interface StatSpec { label: string; value: string | number; hint?: string; tone?: string }

export const EmmaStats = ({ stats }: { stats: StatSpec[] }) => (
  <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
    {stats.map((s, i) => (
      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-wide text-white/45">{s.label}</p>
        <p className={cn("mt-0.5 text-xl font-semibold tabular-nums", s.tone === "red" ? "text-red-300" : s.tone === "green" ? "text-emerald-300" : s.tone === "amber" ? "text-amber-300" : "text-white")}>{s.value}</p>
        {s.hint && <p className="text-[11px] text-white/45">{s.hint}</p>}
      </div>
    ))}
  </div>
);

export const BlockError = ({ text }: { text: string }) => (
  <div className="my-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55"><CircleHelp className="h-3.5 w-3.5" />{text}</div>
);

export { num };
