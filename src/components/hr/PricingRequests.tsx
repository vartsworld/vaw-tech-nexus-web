import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle, ChevronDown, Copy, Download, FileText, Inbox, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search, Tag, Trash2, TrendingUp, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useInquiries } from "@/hooks/useInquiries";
import { PAYMENT_STATUS_META, usePaymentRequests } from "@/hooks/usePaymentRequests";
import PaymentLinkControl from "@/components/hr/PaymentLinkControl";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pricing";
import { INQUIRY_STATUSES, csvEscape, parseInquiry, statusMeta, type ParsedInquiry } from "@/lib/inquiryParser";
import { cn } from "@/lib/utils";

type KindFilter = "all" | "plan" | "custom";
type PayFilter = "all" | "paid" | "pending" | "none";

const waLink = (phone: string | null) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}`;
};

const Stat = ({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) => (
  <Card className="border-white/10 bg-card/70">
    <CardContent className="space-y-1 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-black tracking-tight tabular-nums", tone)}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

const Field = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-foreground">{value}</dd>
    </div>
  ) : null;

/**
 * HR inbox for requests coming from /pricing: package + add-on plans and custom requests.
 * Everything a salesperson needs on one card: who, what, how much, which coupon, and a one-tap way to reply.
 */
const PricingRequests = () => {
  const { toast } = useToast();
  const { rows, loading, error, reload, setRows } = useInquiries((row) => {
    const p = parseInquiry(row);
    if (p.kind !== "general") {
      toast({ title: "New request received", description: `${row.name} · ${p.kind === "plan" ? p.packageName : "Custom request"}` });
    }
  });

  const { byInquiry, available: paymentsAvailable, upsert: upsertPayment, rows: paymentRows } = usePaymentRequests();
  const [kind, setKind] = useState<KindFilter>("all");
  const [pay, setPay] = useState<PayFilter>("all");
  const [status, setStatus] = useState<string>("all");
  const [couponOnly, setCouponOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ParsedInquiry | null>(null);

  const all = useMemo(() => rows.map(parseInquiry).filter((p) => p.kind !== "general"), [rows]);

  const stats = useMemo(() => {
    const openRows = all.filter((p) => p.status === "new" || p.status === "in-progress");
    const won = all.filter((p) => p.status === "completed");
    const sum = (list: ParsedInquiry[]) => list.reduce((t, p) => t + (p.total ?? 0), 0);
    return {
      total: all.length,
      fresh: all.filter((p) => p.status === "new").length,
      pipeline: sum(openRows),
      wonValue: sum(won),
      wonCount: won.length,
      coupons: all.filter((p) => p.coupon).length,
    };
  }, [all]);

  const collected = useMemo(() => {
    const ids = new Set(all.map((p) => p.row.id));
    const paid = paymentRows.filter((r) => r.status === "paid" && r.inquiry_id && ids.has(r.inquiry_id));
    return { count: paid.length, value: paid.reduce((t, r) => t + Number(r.amount_paise) / 100, 0) };
  }, [all, paymentRows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (kind !== "all" && p.kind !== kind) return false;
      if (status !== "all" && p.status !== status) return false;
      if (couponOnly && !p.coupon) return false;
      if (pay !== "all") {
        const st = byInquiry.get(p.row.id)?.status;
        if (pay === "none" ? !!st : pay === "pending" ? st !== "pending" : st !== "paid") return false;
      }
      if (!q) return true;
      return [p.row.name, p.row.email, p.row.phone, p.reference, p.company, p.packageName, p.coupon, ...p.addons].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [all, kind, status, couponOnly, query, pay, byInquiry]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    INQUIRY_STATUSES.forEach((s) => (c[s.value] = all.filter((p) => p.status === s.value).length));
    return c;
  }, [all]);

  const updateStatus = async (p: ParsedInquiry, next: string) => {
    const prev = p.row.status;
    setBusyId(p.row.id);
    setRows((list) => list.map((r) => (r.id === p.row.id ? { ...r, status: next } : r)));
    const { error: err } = await supabase.from("inquiries").update({ status: next, updated_at: new Date().toISOString() }).eq("id", p.row.id);
    setBusyId(null);
    if (err) {
      console.error(err);
      setRows((list) => list.map((r) => (r.id === p.row.id ? { ...r, status: prev } : r)));
      toast({ title: "Couldn't update status", description: "You may not have permission to edit requests.", variant: "destructive" });
      return;
    }
    toast({ title: "Status updated", description: `${p.row.name} → ${statusMeta(next).label}` });
  };

  const remove = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setBusyId(target.row.id);
    const { error: err } = await supabase.from("inquiries").delete().eq("id", target.row.id);
    setBusyId(null);
    setToDelete(null);
    if (err) {
      toast({ title: "Couldn't delete request", description: "You may not have permission to delete requests.", variant: "destructive" });
      return;
    }
    setRows((list) => list.filter((r) => r.id !== target.row.id));
    toast({ title: "Request deleted" });
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${what} copied` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const exportCsv = () => {
    const head = ["Reference", "Received", "Type", "Status", "Name", "Email", "Phone", "Company", "Package", "Add-ons", "Subtotal", "Coupon", "Discount", "GST", "Total", "Timeline", "Budget", "Notes"];
    const lines = visible.map((p) =>
      [
        p.reference, p.row.created_at ? format(new Date(p.row.created_at), "yyyy-MM-dd HH:mm") : "", p.kind, p.status, p.row.name, p.row.email, p.row.phone ?? "",
        p.company, p.packageName, p.addons.join("; "), p.subtotal ?? "", p.coupon, p.discount || "", p.gst ?? "", p.total ?? "", p.timeline, p.budget, p.notes,
      ].map(csvEscape).join(",")
    );
    const blob = new Blob([`\uFEFF${[head.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pricing-requests-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtersActive = kind !== "all" || status !== "all" || pay !== "all" || couponOnly || query.trim() !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Pricing requests</h2>
          <p className="text-sm text-muted-foreground">Plans and custom requests submitted from the public /pricing page. New ones appear here live.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={visible.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Stat label="Needs action" value={stats.fresh} hint={`of ${stats.total} total`} tone={stats.fresh ? "text-blue-400" : undefined} />
          <Stat label="Open pipeline" value={formatPrice(stats.pipeline)} hint="new + in progress, incl. GST" />
          <Stat label="Won" value={formatPrice(stats.wonValue)} hint={`${stats.wonCount} request${stats.wonCount === 1 ? "" : "s"}`} tone="text-emerald-400" />
          <Stat label="Paid online" value={formatPrice(collected.value)} hint={paymentsAvailable ? `${collected.count} payment${collected.count === 1 ? "" : "s"} via VAW Pay` : "Payments not set up yet"} tone="text-emerald-400" />
          <Stat label="Coupon claims" value={stats.coupons} hint={stats.total ? `${Math.round((stats.coupons / stats.total) * 100)}% of plans` : undefined} tone="text-amber-400" />
          <Stat label="Total requests" value={stats.total} />
        </div>
      )}

      {/* Filters */}
      <Card className="border-white/10 bg-card/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone, reference, package, coupon…" className="pl-9" aria-label="Search requests" />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={kind} onValueChange={(v) => setKind(v as KindFilter)}>
              <SelectTrigger className="md:w-[180px]" aria-label="Request type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All request types</SelectItem>
                <SelectItem value="plan">Plan requests</SelectItem>
                <SelectItem value="custom">Custom requests</SelectItem>
              </SelectContent>
            </Select>
            {paymentsAvailable && (
              <Select value={pay} onValueChange={(v) => setPay(v as PayFilter)}>
                <SelectTrigger className="md:w-[180px]" aria-label="Payment status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any payment status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Awaiting payment</SelectItem>
                  <SelectItem value="none">No link yet</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant={couponOnly ? "default" : "outline"} onClick={() => setCouponOnly((v) => !v)} aria-pressed={couponOnly} className="gap-2">
              <Tag className="h-4 w-4" /> Coupon used
            </Button>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by status">
            {[{ value: "all", label: "All" }, ...INQUIRY_STATUSES].map((s) => (
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

      {/* List */}
      {error ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={() => reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-transparent">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">{filtersActive ? "No requests match your filters" : "No pricing requests yet"}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {filtersActive ? "Try a different search or clear the filters." : "When a visitor sends a plan or custom request from /pricing, it shows up here instantly."}
            </p>
            {filtersActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setKind("all");
                  setStatus("all");
                  setPay("all");
                  setCouponOnly(false);
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => {
            const meta = statusMeta(p.status);
            const isOpen = open === p.row.id;
            const wa = waLink(p.row.phone);
            const payment = byInquiry.get(p.row.id);
            const payMeta = payment ? PAYMENT_STATUS_META[payment.status] : null;
            const created = p.row.created_at ? new Date(p.row.created_at) : null;
            return (
              <li key={p.row.id}>
                <Card className={cn("border-white/10 bg-card/70 transition-colors", p.status === "new" && "border-l-4 border-l-blue-500")}>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-foreground">{p.row.name}</h3>
                          <Badge variant="outline" className={cn("border text-[11px]", meta.tone)}>{meta.label}</Badge>
                          <Badge variant="outline" className="border-white/15 text-[11px] text-muted-foreground">{p.kind === "plan" ? "Plan" : "Custom"}</Badge>
                          {payMeta && (
                            <Badge variant="outline" className={cn("border text-[11px]", payMeta.tone)}>
                              {payMeta.label}{payment?.status === "paid" ? ` · ${formatPrice(Number(payment.amount_paise) / 100)}` : ""}
                            </Badge>
                          )}
                          {p.coupon && (
                            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 font-mono text-[11px] text-amber-400">
                              <Tag className="h-3 w-3" /> {p.coupon}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.reference && <span className="font-mono">{p.reference} · </span>}
                          {created ? (
                            <time dateTime={created.toISOString()} title={format(created, "PPP 'at' p")}>
                              {formatDistanceToNow(created, { addSuffix: true })}
                            </time>
                          ) : null}
                          {p.company && <> · {p.company}</>}
                        </p>
                      </div>
                      {p.kind === "plan" && p.total !== null ? (
                        <div className="shrink-0 sm:text-right">
                          <p className="text-xl font-black tabular-nums text-foreground">{formatPrice(p.total)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            incl. GST{p.discount > 0 ? ` · coupon saved ${formatPrice(p.discount)}` : ""}
                          </p>
                        </div>
                      ) : p.budget ? (
                        <div className="shrink-0 sm:text-right">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Budget</p>
                          <p className="text-sm font-semibold text-foreground">{p.budget}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{p.kind === "plan" ? p.packageName || "Add-ons only" : p.requestType || "Custom request"}</p>
                      {p.addons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.addons.map((a) => (
                            <span key={a} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">{a}</span>
                          ))}
                        </div>
                      )}
                      {p.notes && <p className="line-clamp-2 text-sm text-muted-foreground">{p.notes}</p>}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/10 pt-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={p.status} onValueChange={(v) => updateStatus(p, v)} disabled={busyId === p.row.id}>
                          <SelectTrigger className="h-9 w-[170px]" aria-label={`Status for ${p.row.name}`}>
                            {busyId === p.row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            {INQUIRY_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => setOpen(isOpen ? null : p.row.id)} aria-expanded={isOpen} className="gap-1.5">
                          <FileText className="h-4 w-4" /> Details <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild className="gap-1.5">
                          <a href={`mailto:${p.row.email}?subject=${encodeURIComponent(`Your VAW Technologies request ${p.reference}`.trim())}`}><Mail className="h-4 w-4" /> Email</a>
                        </Button>
                        {p.row.phone && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5">
                            <a href={`tel:${p.row.phone}`}><Phone className="h-4 w-4" /> Call</a>
                          </Button>
                        )}
                        {paymentsAvailable && (
                          <PaymentLinkControl
                            inquiryId={p.row.id}
                            customerName={p.row.name}
                            phone={p.row.phone}
                            defaultAmount={p.kind === "plan" ? p.total : null}
                            payment={payment}
                            onCreated={upsertPayment}
                          />
                        )}
                        {wa && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5">
                            <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(p)} aria-label={`Delete request from ${p.row.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="Email" value={p.row.email} />
                          <Field label="Phone" value={p.row.phone ?? ""} />
                          <Field label="Company" value={p.company} />
                          <Field label="Preferred domain" value={p.domain} />
                          <Field label="Timeline" value={p.timeline} />
                          <Field label="Budget" value={p.budget} />
                          {p.kind === "plan" && p.subtotal !== null && <Field label="Subtotal" value={formatPrice(p.subtotal)} />}
                          {p.discount > 0 && <Field label="Coupon discount" value={`− ${formatPrice(p.discount)}`} />}
                          {p.gst !== null && <Field label="GST (18%)" value={formatPrice(p.gst)} />}
                          {payment?.status === "paid" && <Field label="Bank reference (UTR)" value={payment.utr || "Not provided"} />}
                          {payment?.status === "paid" && payment.paid_at && <Field label="Paid at" value={format(new Date(payment.paid_at), "PPP p")} />}
                        </dl>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full message</p>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => copy(p.row.message, "Message")}>
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </Button>
                          </div>
                          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 font-sans text-xs leading-relaxed text-foreground/90">{p.row.message}</pre>
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

      {visible.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" /> Showing {visible.length} of {all.length} request{all.length === 1 ? "" : "s"}
        </p>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `The request from ${toDelete.row.name}${toDelete.reference ? ` (${toDelete.reference})` : ""} will be removed permanently. This can't be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PricingRequests;
