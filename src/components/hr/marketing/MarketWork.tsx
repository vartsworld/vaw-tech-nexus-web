import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Clapperboard, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Search, Star, Trash2, X } from "lucide-react";
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
import { slugify, toStringList, type MarketProject } from "@/lib/marketTypes";
import { cn } from "@/lib/utils";
import { ConfirmDelete, EmptyState, ErrorCard, ListSkeleton, PageHeader, SetupNotice, StatCard } from "./marketUi";

interface Draft {
  title: string; slug: string; brand_label: string; tagline: string; client: string; category: string; year: string; description: string;
  metric: string; metric_label: string; metric_verified: boolean; image_url: string; tags: string; deliverables: string;
  featured: boolean; published: boolean; sort_order: string;
}

const emptyDraft = (nextOrder: number): Draft => ({
  title: "", slug: "", brand_label: "", tagline: "", client: "", category: "", year: String(new Date().getFullYear()), description: "",
  metric: "", metric_label: "", metric_verified: false, image_url: "", tags: "", deliverables: "", featured: true, published: false, sort_order: String(nextOrder),
});

const toDraft = (p: MarketProject): Draft => ({
  title: p.title, slug: p.slug, brand_label: p.brand_label, tagline: p.tagline, client: p.client, category: p.category, year: p.year, description: p.description,
  metric: p.metric, metric_label: p.metric_label, metric_verified: p.metric_verified, image_url: p.image_url,
  tags: toStringList(p.tags).join("\n"), deliverables: toStringList(p.deliverables).join("\n"), featured: p.featured, published: p.published, sort_order: String(p.sort_order),
});

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

const FieldRow = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/** The portfolio / case studies shown in the "Work" area of the marketing site (`market_projects`). */
const MarketWork = () => {
  const { toast } = useToast();
  const { rows, loading, error, available, reload, update, insert, remove } = useMarketTable<MarketProject>("market_projects", { column: "sort_order", ascending: true });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MarketProject | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(100));
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MarketProject | null>(null);

  const sorted = useMemo(() => [...rows].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((p) => [p.title, p.client, p.category, p.brand_label, p.slug].some((v) => (v || "").toLowerCase().includes(q))) : sorted;
  }, [sorted, query]);

  const stats = useMemo(() => ({
    live: rows.filter((p) => p.published).length,
    drafts: rows.filter((p) => !p.published).length,
    unverified: rows.filter((p) => p.published && p.metric && !p.metric_verified).length,
  }), [rows]);

  const openNew = () => {
    setDraft(emptyDraft((rows.reduce((m, p) => Math.max(m, p.sort_order), 0) || 0) + 10));
    setEditing("new");
  };
  const openEdit = (p: MarketProject) => {
    setDraft(toDraft(p));
    setEditing(p);
  };
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    const title = draft.title.trim();
    const slug = (draft.slug.trim() || slugify(title));
    if (!title) return toast({ title: "Add a title", variant: "destructive" });
    if (!slug) return toast({ title: "Add a web address (slug)", variant: "destructive" });
    if (!draft.brand_label.trim()) return toast({ title: "Add a short brand label (shown on the card)", variant: "destructive" });
    if (draft.image_url.trim() && !isHttpUrl(draft.image_url.trim())) return toast({ title: "Image link must start with https://", variant: "destructive" });
    if (draft.metric.trim() && draft.published && !draft.metric_verified) {
      // Allowed, but make the risk visible: unverified numbers are public claims.
      toast({ title: "Heads up: this result isn't marked verified", description: "Visitors will see it. Tick “verified” once the client has confirmed the number." });
    }
    const payload: Partial<MarketProject> = {
      title, slug, brand_label: draft.brand_label.trim(), tagline: draft.tagline.trim(), client: draft.client.trim(), category: draft.category.trim(), year: draft.year.trim(),
      description: draft.description.trim(), metric: draft.metric.trim(), metric_label: draft.metric_label.trim(), metric_verified: draft.metric_verified,
      image_url: draft.image_url.trim(), tags: lines(draft.tags), deliverables: lines(draft.deliverables), featured: draft.featured, published: draft.published,
      sort_order: Number.isFinite(Number(draft.sort_order)) ? Math.round(Number(draft.sort_order)) : 100,
    };
    setSaving(true);
    const err = editing === "new" ? (await insert(payload)).error : editing ? await update(editing.id, payload) : null;
    setSaving(false);
    if (err) return toast({ title: "Couldn't save", description: explainDbError(err), variant: "destructive" });
    toast({ title: editing === "new" ? "Project added" : "Project saved", description: draft.published ? "It's live on the website." : "Saved as a draft. It isn't on the website yet." });
    setEditing(null);
  };

  const toggle = async (p: MarketProject, key: "published" | "featured") => {
    setBusyId(p.id);
    const err = await update(p.id, { [key]: !p[key] } as Partial<MarketProject>);
    setBusyId(null);
    if (err) toast({ title: "Couldn't update", description: explainDbError(err), variant: "destructive" });
    else toast({ title: key === "published" ? (p.published ? "Hidden from the website" : "Now live on the website") : p.featured ? "Removed from featured" : "Marked featured", description: p.title });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setBusyId(target.id);
    const err = await remove(target.id);
    setBusyId(null);
    if (err) toast({ title: "Couldn't delete", description: explainDbError(err), variant: "destructive" });
    else toast({ title: "Project deleted", description: target.title });
  };

  if (!available) return <div className="space-y-6"><PageHeader title="Our work" subtitle="Case studies on the marketing website." /><SetupNotice /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Our work"
        subtitle="The case studies shown on the marketing website. Published ones are public; drafts are only visible here."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button size="sm" onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add project</Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Live on site" value={stats.live} tone="text-emerald-400" />
        <StatCard label="Drafts" value={stats.drafts} />
        <StatCard label="Unverified results" value={stats.unverified} hint="published, number not confirmed" tone={stats.unverified ? "text-amber-400" : undefined} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="pl-9" aria-label="Search projects" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>

      {error ? (
        <ErrorCard message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton rows={3} height="h-40" />
      ) : visible.length === 0 ? (
        <EmptyState icon={Clapperboard} title={query ? "No projects match your search" : "No projects yet"} body="Add the work you've delivered so it can appear on the website." action={!query ? <Button size="sm" onClick={openNew}>Add the first project</Button> : undefined} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((p) => (
            <li key={p.id}>
              <Card className={cn("h-full overflow-hidden border-white/10 bg-card/70", !p.published && "opacity-80")}>
                <div className="flex h-full flex-col sm:flex-row">
                  <div className="relative h-36 shrink-0 bg-black/30 sm:h-auto sm:w-40">
                    {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{p.brand_label}</span>
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold">{p.title}</h3>
                        <Badge variant="outline" className={cn("border text-[11px]", p.published ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/15 text-muted-foreground")}>{p.published ? "Live" : "Draft"}</Badge>
                        {p.featured && <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-400"><Star className="h-3 w-3" /> Featured</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{[p.client, p.category, p.year].filter(Boolean).join(" · ")}</p>
                      {p.metric && (
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                          <span className="font-bold">{p.metric}</span> <span className="text-muted-foreground">{p.metric_label}</span>
                          {p.metric_verified
                            ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><BadgeCheck className="h-3.5 w-3.5" /> verified</span>
                            : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> not verified</span>}
                        </p>
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <Switch checked={p.published} disabled={busyId === p.id} onCheckedChange={() => toggle(p, "published")} aria-label={`Publish ${p.title}`} /> Published
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <Switch checked={p.featured} disabled={busyId === p.id} onCheckedChange={() => toggle(p, "featured")} aria-label={`Feature ${p.title}`} /> Featured
                        </label>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /> Edit</Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(p)} disabled={busyId === p.id} aria-label={`Delete ${p.title}`}>
                          {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !saving && !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add project" : "Edit project"}</DialogTitle>
            <DialogDescription>Fill in what visitors should see. Nothing goes public until “Published” is on.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow id="mw-title" label="Title *"><Input id="mw-title" value={draft.title} maxLength={120} onChange={(e) => set("title", e.target.value)} /></FieldRow>
            <FieldRow id="mw-brand" label="Brand label *" hint="Short, uppercase tag on the card, e.g. S MART"><Input id="mw-brand" value={draft.brand_label} maxLength={30} onChange={(e) => set("brand_label", e.target.value)} /></FieldRow>
            <FieldRow id="mw-slug" label="Web address (slug)" hint={`Leave empty to use “${slugify(draft.title) || "title-of-project"}”`}><Input id="mw-slug" value={draft.slug} maxLength={80} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(draft.title)} /></FieldRow>
            <FieldRow id="mw-client" label="Client"><Input id="mw-client" value={draft.client} maxLength={120} onChange={(e) => set("client", e.target.value)} /></FieldRow>
            <FieldRow id="mw-cat" label="Category"><Input id="mw-cat" value={draft.category} maxLength={120} onChange={(e) => set("category", e.target.value)} /></FieldRow>
            <FieldRow id="mw-year" label="Year"><Input id="mw-year" value={draft.year} maxLength={9} onChange={(e) => set("year", e.target.value)} /></FieldRow>
            <div className="sm:col-span-2"><FieldRow id="mw-tag" label="Tagline"><Input id="mw-tag" value={draft.tagline} maxLength={200} onChange={(e) => set("tagline", e.target.value)} /></FieldRow></div>
            <div className="sm:col-span-2"><FieldRow id="mw-desc" label="Description"><Textarea id="mw-desc" rows={4} value={draft.description} maxLength={2000} onChange={(e) => set("description", e.target.value)} /></FieldRow></div>
            <FieldRow id="mw-metric" label="Headline result" hint="e.g. +82% or 3.9x"><Input id="mw-metric" value={draft.metric} maxLength={30} onChange={(e) => set("metric", e.target.value)} /></FieldRow>
            <FieldRow id="mw-mlabel" label="What the result means"><Input id="mw-mlabel" value={draft.metric_label} maxLength={120} onChange={(e) => set("metric_label", e.target.value)} /></FieldRow>
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:col-span-2">
              <Switch id="mw-verified" checked={draft.metric_verified} onCheckedChange={(v) => set("metric_verified", v)} />
              <div><Label htmlFor="mw-verified">Result is verified</Label><p className="text-xs text-muted-foreground">Only tick this when the client has confirmed the number in writing. Results are public marketing claims.</p></div>
            </div>
            <div className="sm:col-span-2">
              <FieldRow id="mw-img" label="Cover image link" hint="A direct https:// link to the image.">
                <Input id="mw-img" value={draft.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://…" />
              </FieldRow>
              {isHttpUrl(draft.image_url.trim()) && <img src={draft.image_url.trim()} alt="Preview" className="mt-2 h-28 w-full rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
            </div>
            <FieldRow id="mw-tags" label="Tags" hint="One per line"><Textarea id="mw-tags" rows={4} value={draft.tags} onChange={(e) => set("tags", e.target.value)} /></FieldRow>
            <FieldRow id="mw-del" label="What we delivered" hint="One per line"><Textarea id="mw-del" rows={4} value={draft.deliverables} onChange={(e) => set("deliverables", e.target.value)} /></FieldRow>
            <FieldRow id="mw-sort" label="Display order" hint="Lower numbers come first"><Input id="mw-sort" inputMode="numeric" value={draft.sort_order} onChange={(e) => set("sort_order", e.target.value.replace(/[^0-9-]/g, ""))} /></FieldRow>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-sm font-medium"><Switch checked={draft.published} onCheckedChange={(v) => set("published", v)} /> Published on the website</label>
              <label className="flex items-center gap-2 text-sm font-medium"><Switch checked={draft.featured} onCheckedChange={(v) => set("featured", v)} /> Featured</label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!toDelete}
        title="Delete this project?"
        description={toDelete ? `“${toDelete.title}” will be removed permanently. To just take it off the website, switch Published off instead.` : ""}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default MarketWork;
