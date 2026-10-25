import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, Download, FileText, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { explainDbError, useMarketTable } from "@/hooks/useMarketTable";
import { formatPrice } from "@/lib/pricing";
import { toStringList, type MarketPlanQuote } from "@/lib/marketTypes";
import { cn } from "@/lib/utils";
import { ConfirmDelete, EmptyState, ErrorCard, ListSkeleton, PageHeader, SetupNotice, StatCard, downloadCsv, waLink } from "./marketUi";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (v: number | null) => (v === null || v === undefined ? null : Number(v));

const Item = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 break-words text-sm">{value}</dd>
  </div>
);

/** Quotes visitors saved from the marketing site's pricing configurator (`market_plan_quotes`). */
const MarketQuotes = () => {
  const { toast } = useToast();
  const { rows, loading, error, available, reload, remove } = useMarketTable<MarketPlanQuote>("market_plan_quotes", { column: "created_at" });
  const [query, setQuery] = useState("");
  const [withContact, setWithContact] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MarketPlanQuote | null>(null);

  const hasContact = (q: MarketPlanQuote) => !!(q.client_phone || q.client_email);

  const stats = useMemo(() => {
    const monthly = rows.map((q) => num(q.monthly_total)).filter((v): v is number => v !== null && v > 0);
    const byPlan = new Map<string, number>();
    rows.forEach((q) => byPlan.set(q.plan_id, (byPlan.get(q.plan_id) ?? 0) + 1));
    const top = [...byPlan.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      contact: rows.filter(hasContact).length,
      avg: monthly.length ? monthly.reduce((t, v) => t + v, 0) / monthly.length : 0,
      top: top ? `${cap(top[0])} (${top[1]})` : "—",
    };
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (withContact && !hasContact(r)) return false;
      if (!q) return true;
      return [r.client_name, r.client_phone, r.client_email, r.plan_id, r.notes].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, withContact]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setBusyId(target.id);
    const err = await remove(target.id);
    setBusyId(null);
    if (err) toast({ title: "Couldn't delete the quote", description: explainDbError(err), variant: "destructive" });
    else toast({ title: "Quote deleted" });
  };

  const exportCsv = () =>
    downloadCsv(
      `marketing-quotes-${format(new Date(), "yyyy-MM-dd")}.csv`,
      ["Saved", "Plan", "Billing", "Monthly total", "Yearly total", "Website one-time", "Website renewal", "Name", "Phone", "Email", "Notes"],
      visible.map((r) => [format(new Date(r.created_at), "yyyy-MM-dd HH:mm"), r.plan_id, r.billing_cycle, r.monthly_total ?? "", r.yearly_total ?? "", r.website_one_time ?? "", r.website_annual_renewal ?? "", r.client_name ?? "", r.client_phone ?? "", r.client_email ?? "", r.notes ?? ""].map(String))
    );

  if (!available) return <div className="space-y-6"><PageHeader title="Saved quotes" subtitle="Quotes from the website pricing configurator." /><SetupNotice /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved quotes"
        subtitle="Quotes visitors built in the marketing site's pricing configurator. Those with contact details are warm leads."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={visible.length === 0} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total quotes" value={rows.length} />
        <StatCard label="With contact details" value={stats.contact} hint="can be followed up" tone="text-emerald-400" />
        <StatCard label="Average monthly" value={stats.avg ? formatPrice(stats.avg) : "—"} />
        <StatCard label="Most picked plan" value={stats.top} />
      </div>

      <Card className="border-white/10 bg-card/70">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email, plan…" className="pl-9" aria-label="Search quotes" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            )}
          </div>
          <Button variant={withContact ? "default" : "outline"} onClick={() => setWithContact((v) => !v)} aria-pressed={withContact}>Has contact details</Button>
        </CardContent>
      </Card>

      {error ? (
        <ErrorCard message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState icon={FileText} title={query || withContact ? "No quotes match your filters" : "No saved quotes yet"} body="Quotes appear here when a visitor saves one from the marketing site's pricing page." />
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => {
            const isOpen = open === r.id;
            const created = new Date(r.created_at);
            const yearly = r.billing_cycle === "yearly";
            const headline = yearly ? num(r.yearly_total) : num(r.monthly_total);
            const wa = waLink(r.client_phone, `Hi ${r.client_name || "there"}, this is VAW Technologies about the ${cap(r.plan_id)} plan quote you saved.`);
            const platforms = toStringList(r.selected_platforms);
            return (
              <li key={r.id}>
                <Card className="border-white/10 bg-card/70">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold">{r.client_name || "Anonymous visitor"}</h3>
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] text-primary">{cap(r.plan_id)} plan</Badge>
                          <Badge variant="outline" className="border-white/15 text-[11px] text-muted-foreground">{yearly ? "Billed yearly" : "Billed monthly"}</Badge>
                          {!hasContact(r) && <Badge variant="outline" className="border-white/15 text-[11px] text-muted-foreground">No contact details</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={created.toISOString()} title={format(created, "PPP 'at' p")}>{formatDistanceToNow(created, { addSuffix: true })}</time>
                          {r.client_phone && <> · {r.client_phone}</>}
                          {r.client_email && <> · {r.client_email}</>}
                        </p>
                      </div>
                      {headline !== null && (
                        <div className="shrink-0 sm:text-right">
                          <p className="text-xl font-black tabular-nums">{formatPrice(headline)}</p>
                          <p className="text-[11px] text-muted-foreground">{yearly ? "per year" : "per month"}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen} className="w-fit gap-1.5">
                        <FileText className="h-4 w-4" /> Quote details <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                      </Button>
                      <div className="flex flex-wrap gap-2">
                        {r.client_phone && <Button variant="outline" size="sm" asChild className="gap-1.5"><a href={`tel:${r.client_phone}`}><Phone className="h-4 w-4" /> Call</a></Button>}
                        {wa && <Button variant="outline" size="sm" asChild className="gap-1.5"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button>}
                        {r.client_email && <Button variant="outline" size="sm" asChild className="gap-1.5"><a href={`mailto:${r.client_email}`}><Mail className="h-4 w-4" /> Email</a></Button>}
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(r)} disabled={busyId === r.id} aria-label="Delete quote">
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                          <Item label="Videos / month" value={String(r.videos)} />
                          <Item label="Posters / month" value={String(r.posters)} />
                          <Item label="Extra on-location shoots" value={String(r.extra_on_location_sessions)} />
                          <Item label="Personal branding" value={r.personal_branding ? "Yes" : "No"} />
                          <Item label="Dubbing languages" value={String(r.dubbing_languages)} />
                          <Item label="SEO" value={cap(r.seo_tier)} />
                          <Item label="Community" value={cap(r.community_tier)} />
                          <Item label="Ads" value={r.ads_tier === "none" ? "None" : cap(r.ads_tier)} />
                          <Item label="Social media management" value={r.social_media_management ? "Included" : "Not included"} />
                          <Item label="Website" value={r.include_website ? "Included" : "No"} />
                          {num(r.website_one_time) !== null && <Item label="Website one-time" value={formatPrice(num(r.website_one_time) as number)} />}
                          {num(r.website_annual_renewal) !== null && <Item label="Website renewal / yr" value={formatPrice(num(r.website_annual_renewal) as number)} />}
                          {num(r.monthly_total) !== null && <Item label="Monthly total" value={formatPrice(num(r.monthly_total) as number)} />}
                          {num(r.yearly_total) !== null && <Item label="Yearly total" value={formatPrice(num(r.yearly_total) as number)} />}
                        </dl>
                        {platforms.length > 0 && <Item label="Social platforms" value={platforms.join(", ")} />}
                        {r.notes && <Item label="Visitor's notes" value={r.notes} />}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDelete
        open={!!toDelete}
        title="Delete this quote?"
        description="The saved quote will be removed permanently."
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default MarketQuotes;
