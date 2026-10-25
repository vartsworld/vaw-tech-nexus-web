import { useMemo, useState } from "react";
import { format } from "date-fns";
import { FileText, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Markdown } from "@/components/ai/emma/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { explainDbError, useMarketTable } from "@/hooks/useMarketTable";
import { slugify, toStringList, type MarketBlogPost } from "@/lib/marketTypes";
import { cn } from "@/lib/utils";
import { ConfirmDelete, EmptyState, ErrorCard, ListSkeleton, PageHeader, SetupNotice } from "./marketUi";

interface Draft {
  title: string; slug: string; excerpt: string; content_md: string; cover_image: string; author: string; author_role: string; category: string;
  tags: string; seo_title: string; seo_description: string; published: boolean;
}

const blank: Draft = { title: "", slug: "", excerpt: "", content_md: "", cover_image: "", author: "VAW Marketing Team", author_role: "", category: "Growth Playbooks", tags: "", seo_title: "", seo_description: "", published: false };
const toDraft = (p: MarketBlogPost): Draft => ({
  title: p.title, slug: p.slug, excerpt: p.excerpt, content_md: p.content_md, cover_image: p.cover_image, author: p.author, author_role: p.author_role, category: p.category,
  tags: toStringList(p.tags).join(", "), seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "", published: p.published,
});

const readingMinutes = (md: string) => Math.max(1, Math.round(md.trim().split(/\s+/).filter(Boolean).length / 200));
const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

/** Blog articles for the marketing site (`market_blog_posts`), written in lightweight markdown. */
const MarketBlog = () => {
  const { toast } = useToast();
  const { rows, loading, error, available, reload, update, insert, remove } = useMarketTable<MarketBlogPost>("market_blog_posts", { column: "created_at", ascending: false });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MarketBlogPost | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MarketBlogPost | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((p) => [p.title, p.category, p.slug, p.author].some((v) => (v || "").toLowerCase().includes(q))) : rows;
  }, [rows, query]);

  const openNew = () => { setDraft(blank); setMode("write"); setEditing("new"); };
  const openEdit = (p: MarketBlogPost) => { setDraft(toDraft(p)); setMode("write"); setEditing(p); };

  const save = async () => {
    const title = draft.title.trim();
    const slug = draft.slug.trim() || slugify(title);
    if (!title) return toast({ title: "Add a title", variant: "destructive" });
    if (!slug) return toast({ title: "Add a web address (slug)", variant: "destructive" });
    if (draft.cover_image.trim() && !isHttpUrl(draft.cover_image.trim())) return toast({ title: "Cover image link must start with https://", variant: "destructive" });
    if (draft.published && draft.content_md.trim().length < 50) return toast({ title: "Write the article before publishing", description: "It needs a bit more content.", variant: "destructive" });
    const wasPublishedAt = editing && editing !== "new" ? editing.published_at : null;
    const payload: Partial<MarketBlogPost> = {
      title, slug, excerpt: draft.excerpt.trim(), content_md: draft.content_md, cover_image: draft.cover_image.trim(), author: draft.author.trim() || "VAW Marketing Team",
      author_role: draft.author_role.trim(), category: draft.category.trim() || "Growth Playbooks",
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean), reading_minutes: readingMinutes(draft.content_md),
      seo_title: draft.seo_title.trim() || null, seo_description: draft.seo_description.trim() || null,
      published: draft.published, published_at: draft.published ? wasPublishedAt ?? new Date().toISOString() : wasPublishedAt,
    };
    setSaving(true);
    const err = editing === "new" ? (await insert(payload)).error : editing ? await update(editing.id, payload) : null;
    setSaving(false);
    if (err) return toast({ title: "Couldn't save", description: explainDbError(err), variant: "destructive" });
    toast({ title: "Article saved", description: draft.published ? "It's live on the website." : "Saved as a draft." });
    setEditing(null);
  };

  const togglePublish = async (p: MarketBlogPost) => {
    setBusyId(p.id);
    const err = await update(p.id, { published: !p.published, published_at: !p.published ? p.published_at ?? new Date().toISOString() : p.published_at });
    setBusyId(null);
    if (err) toast({ title: "Couldn't update", description: explainDbError(err), variant: "destructive" });
    else toast({ title: p.published ? "Hidden from the website" : "Now live on the website", description: p.title });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setBusyId(target.id);
    const err = await remove(target.id);
    setBusyId(null);
    if (err) toast({ title: "Couldn't delete", description: explainDbError(err), variant: "destructive" });
    else toast({ title: "Article deleted", description: target.title });
  };

  if (!available) return <div className="space-y-6"><PageHeader title="Blog" subtitle="Articles on the marketing website." /><SetupNotice /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        subtitle="Articles on the marketing website. Drafts are only visible here until you publish them."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button size="sm" onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New article</Button>
          </>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles…" className="pl-9" aria-label="Search articles" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>

      {error ? (
        <ErrorCard message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton height="h-24" />
      ) : visible.length === 0 ? (
        <EmptyState icon={FileText} title={query ? "No articles match your search" : "No articles yet"} body="Write an article to publish it on the website." action={!query ? <Button size="sm" onClick={openNew}>Write the first article</Button> : undefined} />
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => (
            <li key={p.id}>
              <Card className="border-white/10 bg-card/70">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">{p.title}</h3>
                      <Badge variant="outline" className={cn("border text-[11px]", p.published ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/15 text-muted-foreground")}>{p.published ? "Live" : "Draft"}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[p.category, p.author, `${p.reading_minutes} min read`, p.published_at ? `Published ${format(new Date(p.published_at), "d MMM yyyy")}` : `Created ${format(new Date(p.created_at), "d MMM yyyy")}`].join(" · ")}
                    </p>
                    {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <label className="flex items-center gap-2 text-xs font-medium"><Switch checked={p.published} disabled={busyId === p.id} onCheckedChange={() => togglePublish(p)} aria-label={`Publish ${p.title}`} /> Published</label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /> Edit</Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setToDelete(p)} disabled={busyId === p.id} aria-label={`Delete ${p.title}`}>
                        {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New article" : "Edit article"}</DialogTitle>
            <DialogDescription>Write in simple markdown (## headings, **bold**, - lists, [links](https://…)).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="mb-title">Title *</Label><Input id="mb-title" value={draft.title} maxLength={160} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="mb-slug">Web address (slug)</Label><Input id="mb-slug" value={draft.slug} maxLength={80} placeholder={slugify(draft.title)} onChange={(e) => set("slug", slugify(e.target.value))} /><p className="text-xs text-muted-foreground">Leave empty to use “{slugify(draft.title) || "title-of-article"}”. Changing it later breaks existing links.</p></div>
            <div className="space-y-1.5"><Label htmlFor="mb-cat">Category</Label><Input id="mb-cat" value={draft.category} onChange={(e) => set("category", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="mb-author">Author</Label><Input id="mb-author" value={draft.author} onChange={(e) => set("author", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="mb-role">Author role</Label><Input id="mb-role" value={draft.author_role} onChange={(e) => set("author_role", e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="mb-excerpt">Short summary</Label><Textarea id="mb-excerpt" rows={2} maxLength={400} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="mb-body">Article</Label>
                <Tabs value={mode} onValueChange={(v) => setMode(v as "write" | "preview")}>
                  <TabsList className="h-8"><TabsTrigger value="write" className="px-3 py-1 text-xs">Write</TabsTrigger><TabsTrigger value="preview" className="px-3 py-1 text-xs">Preview</TabsTrigger></TabsList>
                </Tabs>
              </div>
              {mode === "write" ? (
                <Textarea id="mb-body" rows={14} value={draft.content_md} onChange={(e) => set("content_md", e.target.value)} className="font-mono text-sm" />
              ) : (
                <div className="min-h-[18rem] rounded-md border border-white/10 bg-black/20 p-4">{draft.content_md.trim() ? <Markdown text={draft.content_md} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}</div>
              )}
              <p className="text-xs text-muted-foreground">≈ {readingMinutes(draft.content_md)} min read (calculated automatically)</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mb-cover">Cover image link</Label>
              <Input id="mb-cover" value={draft.cover_image} placeholder="https://…" onChange={(e) => set("cover_image", e.target.value)} />
              {isHttpUrl(draft.cover_image.trim()) && <img src={draft.cover_image.trim()} alt="Cover preview" className="mt-2 h-28 w-full rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="mb-tags">Tags</Label><Input id="mb-tags" value={draft.tags} placeholder="seo, instagram, video" onChange={(e) => set("tags", e.target.value)} /><p className="text-xs text-muted-foreground">Separate with commas</p></div>
            <div className="space-y-1.5"><Label htmlFor="mb-seot">Search title (SEO)</Label><Input id="mb-seot" value={draft.seo_title} maxLength={70} onChange={(e) => set("seo_title", e.target.value)} /><p className="text-xs text-muted-foreground">{draft.seo_title.length}/60 recommended</p></div>
            <div className="space-y-1.5"><Label htmlFor="mb-seod">Search description (SEO)</Label><Textarea id="mb-seod" rows={2} maxLength={170} value={draft.seo_description} onChange={(e) => set("seo_description", e.target.value)} /><p className="text-xs text-muted-foreground">{draft.seo_description.length}/160 recommended</p></div>
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><Switch checked={draft.published} onCheckedChange={(v) => set("published", v)} /> Published on the website</label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save article</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete open={!!toDelete} title="Delete this article?" description={toDelete ? `“${toDelete.title}” will be removed permanently. To just take it off the website, switch Published off instead.` : ""} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
};

export default MarketBlog;
