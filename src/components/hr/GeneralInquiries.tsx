import { useMemo, useState } from "react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { AlertCircle, Inbox, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { INQUIRY_STATUSES, isPricingInquiry, statusMeta, type InquiryRow } from "@/lib/inquiryParser";
import { cn } from "@/lib/utils";

/** Messages from the website contact forms (everything that is not a pricing request). */
const GeneralInquiries = () => {
  const { toast } = useToast();
  const { rows, loading, error, reload, setRows } = useInquiries((row) => {
    if (!isPricingInquiry(row)) toast({ title: "New message received", description: `${row.name} · ${row.email}` });
  });
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<InquiryRow | null>(null);

  const all = useMemo(() => rows.filter((r) => !isPricingInquiry(r)), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (status !== "all" && (r.status || "new") !== status) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone, r.service, r.message].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [all, status, query]);

  const weekAgo = subDays(new Date(), 7).getTime();
  const stats = {
    fresh: all.filter((r) => (r.status || "new") === "new").length,
    week: all.filter((r) => r.created_at && new Date(r.created_at).getTime() >= weekAgo).length,
    total: all.length,
  };

  const updateStatus = async (r: InquiryRow, next: string) => {
    const prev = r.status;
    setBusyId(r.id);
    setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    const { error: err } = await supabase.from("inquiries").update({ status: next, updated_at: new Date().toISOString() }).eq("id", r.id);
    setBusyId(null);
    if (err) {
      setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status: prev } : x)));
      toast({ title: "Couldn't update status", description: "You may not have permission to edit messages.", variant: "destructive" });
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setBusyId(target.id);
    const { error: err } = await supabase.from("inquiries").delete().eq("id", target.id);
    setBusyId(null);
    if (err) {
      toast({ title: "Couldn't delete message", description: "You may not have permission to delete messages.", variant: "destructive" });
      return;
    }
    setRows((list) => list.filter((x) => x.id !== target.id));
    toast({ title: "Message deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">General inquiries</h2>
          <p className="text-sm text-muted-foreground">Messages sent through the website contact forms.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Needs reply", value: stats.fresh, tone: stats.fresh ? "text-blue-400" : "" },
          { label: "Last 7 days", value: stats.week, tone: "" },
          { label: "All messages", value: stats.total, tone: "" },
        ].map((s) => (
          <Card key={s.label} className="border-white/10 bg-card/70">
            <CardContent className="space-y-1 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={cn("text-2xl font-black tabular-nums", s.tone)}>{loading ? "–" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-card/70">
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone or message…" className="pl-9" aria-label="Search messages" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by status">
            {[{ value: "all", label: "All" }, ...INQUIRY_STATUSES].map((s) => {
              const n = s.value === "all" ? all.length : all.filter((r) => (r.status || "new") === s.value).length;
              return (
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
                  {s.label} <span className="ml-1 opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={() => reload()}>Try again</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-transparent">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">{query || status !== "all" ? "No messages match your filters" : "No messages yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => {
            const meta = statusMeta(r.status);
            const created = r.created_at ? new Date(r.created_at) : null;
            const digits = (r.phone || "").replace(/\D/g, "");
            return (
              <li key={r.id}>
                <Card className={cn("border-white/10 bg-card/70", (r.status || "new") === "new" && "border-l-4 border-l-blue-500")}>
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">{r.name}</h3>
                      <Badge variant="outline" className={cn("border text-[11px]", meta.tone)}>{meta.label}</Badge>
                      {r.service && <Badge variant="outline" className="border-white/15 text-[11px] text-muted-foreground">{r.service}</Badge>}
                      {created && (
                        <time className="ml-auto text-xs text-muted-foreground" dateTime={created.toISOString()} title={format(created, "PPP 'at' p")}>
                          {formatDistanceToNow(created, { addSuffix: true })}
                        </time>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </p>
                    <p className="whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 text-sm leading-relaxed">{r.message}</p>
                    <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <Select value={r.status || "new"} onValueChange={(v) => updateStatus(r, v)} disabled={busyId === r.id}>
                        <SelectTrigger className="h-9 w-[170px]" aria-label={`Status for ${r.name}`}>
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                          {INQUIRY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild className="gap-1.5">
                          <a href={`mailto:${r.email}`}><Mail className="h-4 w-4" /> Reply</a>
                        </Button>
                        {r.phone && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5">
                            <a href={`tel:${r.phone}`}><Phone className="h-4 w-4" /> Call</a>
                          </Button>
                        )}
                        {digits && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5">
                            <a href={`https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(r)} aria-label={`Delete message from ${r.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete ? `The message from ${toDelete.name} will be removed permanently.` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneralInquiries;
