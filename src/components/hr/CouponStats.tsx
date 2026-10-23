import { useMemo } from "react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { Gift, Percent, Tag, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInquiries } from "@/hooks/useInquiries";
import { formatPrice } from "@/lib/pricing";
import { claimsForCoupon, statusMeta } from "@/lib/inquiryParser";
import { cn } from "@/lib/utils";

interface CouponStatsProps {
  code: string;
  enabled: boolean;
}

/**
 * Who claimed the coupon? A claim is a plan request submitted from /pricing with the code applied,
 * so numbers update live as requests arrive.
 */
const CouponStats = ({ code, enabled }: CouponStatsProps) => {
  const { rows, loading, error } = useInquiries();
  const claims = useMemo(() => claimsForCoupon(rows, code), [rows, code]);

  const stats = useMemo(() => {
    const weekAgo = subDays(new Date(), 7).getTime();
    const emails = new Set(claims.map((c) => c.row.email.trim().toLowerCase()));
    return {
      total: claims.length,
      unique: emails.size,
      week: claims.filter((c) => c.row.created_at && new Date(c.row.created_at).getTime() >= weekAgo).length,
      won: claims.filter((c) => c.status === "completed").length,
      saved: claims.reduce((t, c) => t + c.discount, 0),
      value: claims.reduce((t, c) => t + (c.total ?? 0), 0),
    };
  }, [claims]);

  const items = [
    { label: "Claims", value: stats.total, hint: `${stats.week} in the last 7 days`, Icon: Tag, tone: "text-amber-400" },
    { label: "Unique customers", value: stats.unique, hint: "by email address", Icon: Users, tone: "text-sky-400" },
    { label: "Converted", value: stats.won, hint: stats.total ? `${Math.round((stats.won / stats.total) * 100)}% marked won` : "marked won", Icon: TrendingUp, tone: "text-emerald-400" },
    { label: "Discount given", value: formatPrice(stats.saved), hint: `on ${formatPrice(stats.value)} quoted`, Icon: Percent, tone: "text-violet-400" },
  ];

  return (
    <Card className="border-white/10 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-amber-400" /> Coupon performance
          {code ? (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 font-mono text-xs text-amber-400">{code}</Badge>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">Set a coupon code to start tracking claims</span>
          )}
          {code && !enabled && <Badge variant="outline" className="border-white/15 text-[11px] text-muted-foreground">Offer hidden</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {items.map(({ label, value, hint, Icon, tone }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Icon className={cn("h-3.5 w-3.5", tone)} /> {label}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && code && (
          claims.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 p-4 text-center text-sm text-muted-foreground">
              No one has claimed <span className="font-mono">{code}</span> yet. Claims appear here the moment a visitor submits a request with the code applied.
            </p>
          ) : (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent claims</p>
              <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
                {claims.slice(0, 8).map((c) => {
                  const meta = statusMeta(c.status);
                  const created = c.row.created_at ? new Date(c.row.created_at) : null;
                  return (
                    <li key={c.row.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.row.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.packageName}
                          {created && <> · <time title={format(created, "PPP 'at' p")}>{formatDistanceToNow(created, { addSuffix: true })}</time></>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {c.discount > 0 && <span className="text-xs text-emerald-400">saved {formatPrice(c.discount)}</span>}
                        {c.total !== null && <span className="text-sm font-bold tabular-nums">{formatPrice(c.total)}</span>}
                        <Badge variant="outline" className={cn("border text-[11px]", meta.tone)}>{meta.label}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {claims.length > 8 && <p className="mt-2 text-xs text-muted-foreground">Showing the latest 8 of {claims.length}. See all of them under Pricing Requests (filter "Coupon used").</p>}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default CouponStats;
