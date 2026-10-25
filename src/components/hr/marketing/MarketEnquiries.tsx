import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { ChevronDown, Download, FileText, Inbox, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2, UserCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { explainDbError, useMarketTable } from "@/hooks/useMarketTable";
import { supabase } from "@/integrations/supabase/client";
import { ENQUIRY_STATUSES, enquiryStatusMeta, type MarketEnquiry } from "@/lib/marketTypes";
import { cn } from "@/lib/utils";
import { ConfirmDelete, EmptyState, ErrorCard, ListSkeleton, PageHeader, SetupNotice, StatCard, downloadCsv, waLink } from "./marketUi";

/** Leads from the marketing website's contact / project-brief form (`market_enquiries`). */
const MarketEnquiries = () => {
  const { toast } = useToast();
  const { rows, loading, error, available, reload, update, remove } = useMarketTable<MarketEnquiry>("market_enquiries", { column: "created_at" });
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MarketEnquiry | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [me, setMe] = useState<string | null>(null);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    supabase.from("staff_profiles").select("user_id, full_name").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((s: { user_id: string | null; full_name: string | null }) => { if (s.user_id) map[s.user_id] = s.full_name || "Staff"; });
      setStaffNames(map);
    });
  }, []);

  const stats = useMemo(() => {
    const weekAgo = subDays(new Date(), 7).getTime();
    const converted = rows.filter((r) => r.status === "converted").length;
    return {
      fresh: rows.filter((r) => r.status === "new").length,
      week: rows.filter((r) => +new Date(r.created_at) >= weekAgo).length,
      active: rows.filter((r) => ["contacted", "meeting_scheduled", "in_progress"].includes(r.status)).length,
      converted,
      rate: rows.length ? Math.round((converted / rows.length) * 100) : 0,
    };
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    ENQUIRY_STATUSES.forEach((s) => (c[s.value] = rows.filter((r) => r.status === s.value).length));
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.full_name, r.phone, r.email, r.company, r.message, r.budget, r.source].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, status, query]);

  const patch = async (r: MarketEnquiry, change: Partial<MarketEnquiry>, okTitle: string) => {
    setBusyId(r.id);
    const err = await update(r.id, change);
    setBusyId(null);
    if (err) toast({ title: "Couldn't save the change", description: explainDbError(err), variant: "destructive" });
    else toast({ title: okTitle, description: r.full_name });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setBusyId(target.id);
    const err = await remove(target.id);
    setBusyId(null);
    if (err) toast({ title: "Couldn't delete the enquiry", description: explainDbError(err), variant: "destructive" });
    else toast({ title: "Enquiry deleted" });
  };

  const exportCsv = () =>
    downloadCsv(
      `marketing-enquiries-${format(new Date(), "yyyy-MM-dd")}.csv`,
      ["Received", "Status", "Name", "Phone", "Email", "Company", "Budget", "Source", "Message", "Notes"],
      visible.map((r) => [format(new Date(r.created_at), "yyyy-MM-dd HH:mm"), r.status, r.full_name, r.phone, r.email ?? "", r.company ?? "", r.budget ?? "", r.source, r.message ?? "", r.notes ?? ""])
    );

  if (!available) return <div className="space-y-6"><PageHeader title="Site enquiries" subtitle="Leads from the marketing website." /><SetupNotice /></div>;

  const filtersActive = status !== "all" || query.trim() !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site enquiries"
        subtitle="Contact and project-brief submissions from the marketing website. New ones appear here live."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={visible.length === 0} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Needs action" value={stats.fresh} hint={`of ${rows.length} total`} tone={stats.fresh ? "text-blue-400" : undefined} />
        <StatCard label="Last 7 days" value={stats.week} />
        <StatCard label="In conversation" value={stats.active} hint="contacted → in progress" tone="text-amber-400" />
        <StatCard label="Converted" value={stats.converted} tone="text-emerald-400" />
        <StatCard label="Conversion" value={`${stats.rate}%`} hint="of all enquiries" />
      </div>

      <Card className="border-white/10 bg-card/70">
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email, company, message…" className="pl-9" aria-label="Search enquiries" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by status">
            {[{ value: "all", label: "All" }, ...ENQUIRY_STATUSES].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                aria-pressed={status === s.value}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  status === s.value ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                )}
              >
                {s.label} <span className="ml-1 opacity-70">{counts[s.value] ?? 0}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorCard message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filtersActive ? "No enquiries match your filters" : "No enquiries yet"}
          body={filtersActive ? "Try a different search or clear the filters." : "When someone sends the contact form on the marketing website, it shows up here instantly."}
          action={filtersActive ? <Button variant="outline" size="sm" onClick={() => { setStatus("all"); setQuery(""); }}>Clear filters</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => {
            const meta = enquiryStatusMeta(r.status);
            const isOpen = open === r.id;
            const wa = waLink(r.phone, `Hi ${r.full_name}, this is VAW Technologies following up on your enquiry.`);
            const created = new Date(r.created_at);
            const assignee = r.assigned_to ? (r.assigned_to === me ? "You" : staffNames[r.assigned_to] || "Assigned") : null;
            const draft = drafts[r.id] ?? r.notes ?? "";
            return (
              <li key={r.id}>
                <Card className={cn("border-white/10 bg-card/70", r.status === "new" && "border-l-4 border-l-blue-500")}>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold">{r.full_name}</h3>
                          <Badge variant="outline" className={cn("border text-[11px]", meta.tone)}>{meta.label}</Badge>
                          <Badge variant="outline" className="border-white/15 text-[11px] text-muted-foreground">{r.source.replace(/_/g, " ")}</Badge>
                          {assignee && <Badge variant="outline" className="gap-1 border-white/15 text-[11px] text-muted-foreground"><UserCheck className="h-3 w-3" /> {assignee}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={created.toISOString()} title={format(created, "PPP 'at' p")}>{formatDistanceToNow(created, { addSuffix: true })}</time>
                          {r.company && <> · {r.company}</>}
                          {r.budget && <> · Budget: {r.budget}</>}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm text-foreground">{r.phone}</p>
                    </div>

                    {r.message && <p className={cn("whitespace-pre-wrap break-words text-sm text-muted-foreground", !isOpen && "line-clamp-3")}>{r.message}</p>}

                    <div className="flex flex-col gap-3 border-t border-white/10 pt-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={r.status} onValueChange={(v) => patch(r, { status: v }, `Marked ${enquiryStatusMeta(v).label.toLowerCase()}`)} disabled={busyId === r.id}>
                          <SelectTrigger className="h-9 w-[190px]" aria-label={`Status for ${r.full_name}`}>
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            {ENQUIRY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen} className="gap-1.5">
                          <FileText className="h-4 w-4" /> Details &amp; notes <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild className="gap-1.5"><a href={`tel:${r.phone}`}><Phone className="h-4 w-4" /> Call</a></Button>
                        {wa && <Button variant="outline" size="sm" asChild className="gap-1.5"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button>}
                        {r.email && <Button variant="outline" size="sm" asChild className="gap-1.5"><a href={`mailto:${r.email}?subject=${encodeURIComponent("Your enquiry to VAW Technologies")}`}><Mail className="h-4 w-4" /> Email</a></Button>}
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(r)} aria-label={`Delete enquiry from ${r.full_name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</dt><dd className="mt-0.5 break-all">{r.email || "—"}</dd></div>
                          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Received</dt><dd className="mt-0.5">{format(created, "PPP p")}</dd></div>
                          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Privacy notice accepted</dt><dd className="mt-0.5">{r.privacy_acknowledged_at ? format(new Date(r.privacy_acknowledged_at), "PPP p") : "No record"}</dd></div>
                        </dl>
                        <div className="space-y-2">
                          <label htmlFor={`notes-${r.id}`} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Internal notes (never shown on the website)</label>
                          <Textarea id={`notes-${r.id}`} value={draft} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))} rows={3} maxLength={4000} placeholder="Call outcome, next step, quote sent…" />
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" disabled={draft === (r.notes ?? "") || busyId === r.id} onClick={() => patch(r, { notes: draft.trim() || null }, "Notes saved")}>Save notes</Button>
                            {me && (
                              r.assigned_to === me
                                ? <Button size="sm" variant="outline" onClick={() => patch(r, { assigned_to: null }, "Unassigned")}>Unassign me</Button>
                                : <Button size="sm" variant="outline" onClick={() => patch(r, { assigned_to: me }, "Assigned to you")}>Assign to me</Button>
                            )}
                          </div>
                        </div>
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
        title="Delete this enquiry?"
        description={toDelete ? `The enquiry from ${toDelete.full_name} will be removed permanently. Consider marking it Closed instead if you may need the record later.` : ""}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default MarketEnquiries;
