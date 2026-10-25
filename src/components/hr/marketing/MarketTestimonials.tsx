import { useState } from "react";
import { format } from "date-fns";
import { Loader2, MessageSquareQuote, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { explainDbError, useMarketTable } from "@/hooks/useMarketTable";
import type { MarketTestimonial } from "@/lib/marketTypes";
import { cn } from "@/lib/utils";
import { ConfirmDelete, EmptyState, ErrorCard, ListSkeleton, PageHeader, SetupNotice } from "./marketUi";

interface Draft { quote: string; author_name: string; author_role: string; company: string; consent: boolean; published: boolean; sort_order: string }
const blank: Draft = { quote: "", author_name: "", author_role: "", company: "", consent: false, published: false, sort_order: "100" };

/** Client feedback for the marketing site. A testimonial only goes public with recorded consent (`market_testimonials`). */
const MarketTestimonials = () => {
  const { toast } = useToast();
  const { rows, loading, error, available, reload, update, insert, remove } = useMarketTable<MarketTestimonial>("market_testimonials", { column: "sort_order", ascending: true });
  const [editing, setEditing] = useState<MarketTestimonial | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MarketTestimonial | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const openNew = () => { setDraft(blank); setEditing("new"); };
  const openEdit = (t: MarketTestimonial) => {
    setDraft({ quote: t.quote, author_name: t.author_name, author_role: t.author_role, company: t.company, consent: !!t.consent_received_at, published: t.published, sort_order: String(t.sort_order) });
    setEditing(t);
  };

  const save = async () => {
    const quote = draft.quote.trim();
    const author = draft.author_name.trim();
    if (quote.length < 20) return toast({ title: "The quote needs at least 20 characters", variant: "destructive" });
    if (author.length < 2) return toast({ title: "Add the person's name", variant: "destructive" });
    if (draft.published && !draft.consent) return toast({ title: "Record consent before publishing", description: "Only publish a testimonial the person has agreed to.", variant: "destructive" });
    const existingConsent = editing && editing !== "new" ? editing.consent_received_at : null;
    const payload: Partial<MarketTestimonial> = {
      quote, author_name: author, author_role: draft.author_role.trim(), company: draft.company.trim(),
      consent_received_at: draft.consent ? existingConsent ?? new Date().toISOString() : null,
      published: draft.published && draft.consent,
      sort_order: Number.isFinite(Number(draft.sort_order)) ? Math.round(Number(draft.sort_order)) : 100,
    };
    setSaving(true);
    const err = editing === "new" ? (await insert(payload)).error : editing ? await update(editing.id, payload) : null;
    setSaving(false);
    if (err) return toast({ title: "Couldn't save", description: explainDbError(err), variant: "destructive" });
    toast({ title: "Testimonial saved" });
    setEditing(null);
  };

  const togglePublish = async (t: MarketTestimonial) => {
    if (!t.published && !t.consent_received_at) return toast({ title: "Record consent first", description: "Edit the testimonial and confirm the person agreed to it being published.", variant: "destructive" });
    setBusyId(t.id);
    const err = await update(t.id, { published: !t.published });
    setBusyId(null);
    if (err) toast({ title: "Couldn't update", description: explainDbError(err), variant: "destructive" });
    else toast({ title: t.published ? "Hidden from the website" : "Now live on the website", description: t.author_name });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setBusyId(target.id);
    const err = await remove(target.id);
    setBusyId(null);
    if (err) toast({ title: "Couldn't delete", description: explainDbError(err), variant: "destructive" });
    else toast({ title: "Testimonial deleted" });
  };

  if (!available) return <div className="space-y-6"><PageHeader title="Testimonials" subtitle="Client feedback on the marketing website." /><SetupNotice /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials"
        subtitle="Client feedback for the website. A testimonial is only shown publicly when it is published and consent is on record."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button size="sm" onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add testimonial</Button>
          </>
        }
      />

      {error ? (
        <ErrorCard message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton height="h-28" />
      ) : rows.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No testimonials yet" body="Add feedback from a client who has agreed to it being shown on the website." action={<Button size="sm" onClick={openNew}>Add a testimonial</Button>} />
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <li key={t.id}>
              <Card className="border-white/10 bg-card/70">
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <blockquote className="whitespace-pre-wrap break-words text-sm leading-relaxed">“{t.quote}”</blockquote>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{t.author_name}</p>
                    <span className="text-xs text-muted-foreground">{[t.author_role, t.company].filter(Boolean).join(" · ")}</span>
                    <Badge variant="outline" className={cn("border text-[11px]", t.published && t.consent_received_at ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/15 text-muted-foreground")}>{t.published && t.consent_received_at ? "Live" : "Not public"}</Badge>
                    {t.consent_received_at
                      ? <Badge variant="outline" className="gap-1 border-white/15 text-[11px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Consent {format(new Date(t.consent_received_at), "d MMM yyyy")}</Badge>
                      : <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-400">No consent recorded</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <label className="flex items-center gap-2 text-xs font-medium"><Switch checked={t.published} disabled={busyId === t.id} onCheckedChange={() => togglePublish(t)} aria-label={`Publish testimonial from ${t.author_name}`} /> Published</label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /> Edit</Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(t)} disabled={busyId === t.id} aria-label={`Delete testimonial from ${t.author_name}`}>
                        {busyId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !saving && !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add testimonial" : "Edit testimonial"}</DialogTitle>
            <DialogDescription>Use the person's own words. Don't edit a quote without their approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="mt-quote">Quote *</Label><Textarea id="mt-quote" rows={5} maxLength={2000} value={draft.quote} onChange={(e) => set("quote", e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="mt-name">Name *</Label><Input id="mt-name" maxLength={160} value={draft.author_name} onChange={(e) => set("author_name", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="mt-role">Role</Label><Input id="mt-role" value={draft.author_role} onChange={(e) => set("author_role", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="mt-co">Company</Label><Input id="mt-co" value={draft.company} onChange={(e) => set("company", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="mt-sort">Display order</Label><Input id="mt-sort" inputMode="numeric" value={draft.sort_order} onChange={(e) => set("sort_order", e.target.value.replace(/[^0-9-]/g, ""))} /></div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <Switch id="mt-consent" checked={draft.consent} onCheckedChange={(v) => setDraft((d) => ({ ...d, consent: v, published: v ? d.published : false }))} />
              <div><Label htmlFor="mt-consent">The person agreed to this being published</Label><p className="text-xs text-muted-foreground">Keep their written approval (WhatsApp or email) on file. The date is recorded when you save.</p></div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium"><Switch checked={draft.published} disabled={!draft.consent} onCheckedChange={(v) => set("published", v)} /> Published on the website</label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete open={!!toDelete} title="Delete this testimonial?" description={toDelete ? `The testimonial from ${toDelete.author_name} will be removed permanently.` : ""} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
};

export default MarketTestimonials;
