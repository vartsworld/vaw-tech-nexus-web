import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CalendarClock, Link2, Loader2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PLATFORMS, platformInfo } from "@/lib/postit/platforms";
import { checkPost, fromLocalInput, hashtagLine, isHttpUrl, mediaKind, parseHashtags, quickSlots, textLength, toLocalInput } from "@/lib/postit/schedule";
import { INTERNAL_CLIENT, type ClientLite, type PlatformKey, type PostitAccount, type PostitPost, type PublishMode } from "@/lib/postit/types";
import { cn } from "@/lib/utils";
import { PlatformBadge, PostPreview } from "./postitUi";

export interface ComposerSeed {
  /** Edit this post (platform is fixed) */
  post?: PostitPost;
  /** Start a new post from a copy of this one */
  copyOf?: PostitPost;
  date?: Date;
  clientId?: string;
}

export interface ComposerResult {
  editingId: string | null;
  rows: Partial<PostitPost>[];
}

interface Props {
  open: boolean;
  seed: ComposerSeed | null;
  clients: ClientLite[];
  accounts: PostitAccount[];
  onClose: () => void;
  onSave: (result: ComposerResult) => Promise<string | null>;
}

const MAX_FILE = 50 * 1024 * 1024;
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];
const NONE = "__none__";

export const PostComposer = ({ open, seed, clients, accounts, onClose, onSave }: Props) => {
  const { toast } = useToast();
  const editing = seed?.post ?? null;
  const base = editing ?? seed?.copyOf ?? null;

  const [clientId, setClientId] = useState<string>(INTERNAL_CLIENT);
  const [platforms, setPlatforms] = useState<PlatformKey[]>([]);
  const [accountBy, setAccountBy] = useState<Record<string, string>>({});
  const [caption, setCaption] = useState("");
  const [overrides, setOverrides] = useState<Partial<Record<PlatformKey, string>>>({});
  const [tab, setTab] = useState<"all" | PlatformKey>("all");
  const [tags, setTags] = useState("");
  const [title, setTitle] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [link, setLink] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState<PublishMode>("manual");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState<"draft" | "schedule" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const originalWhen = useRef<string>("");

  // Reset the form whenever the dialog opens with a new seed.
  useEffect(() => {
    if (!open || !seed) return;
    const src = seed.post ?? seed.copyOf ?? null;
    setClientId(src ? src.client_id ?? INTERNAL_CLIENT : seed.clientId ?? INTERNAL_CLIENT);
    setPlatforms(src ? [src.platform] : []);
    setAccountBy(src?.account_id ? { [src.platform]: src.account_id } : {});
    setCaption(src?.caption ?? "");
    setOverrides({});
    setTab("all");
    setTags((src?.hashtags ?? []).map((t) => `#${t}`).join(" "));
    setTitle(src?.title ?? "");
    setMedia(src?.media_urls ?? []);
    setMediaUrl("");
    setLink(src?.link_url ?? "");
    const initialWhen = seed.post?.scheduled_at ? toLocalInput(new Date(seed.post.scheduled_at)) : seed.date ? toLocalInput(seed.date) : "";
    setWhen(initialWhen);
    originalWhen.current = seed.post?.scheduled_at ? initialWhen : "";
    setMode(src?.publish_mode ?? "manual");
    setNotes(src?.notes ?? "");
    setSaving(null);
    setFormError(null);
  }, [open, seed]);

  const clientAccounts = useMemo(
    () => accounts.filter((a) => a.status === "active" && (clientId === INTERNAL_CLIENT ? a.client_id === null : a.client_id === clientId)),
    [accounts, clientId],
  );
  const accountFor = (p: PlatformKey) => accounts.find((a) => a.id === accountBy[p]) ?? null;
  const hashtags = useMemo(() => parseHashtags(tags), [tags]);
  const captionFor = (p: PlatformKey) => (overrides[p] !== undefined && overrides[p] !== "" ? (overrides[p] as string) : caption);
  const previewPlatform = tab === "all" ? platforms[0] : tab;

  const togglePlatform = (p: PlatformKey) => {
    if (editing) return;
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
    setTab((t) => (t === p ? "all" : t));
  };

  const changeClient = (id: string) => {
    setClientId(id);
    setAccountBy({}); // accounts belong to a client
  };

  const issues = useMemo(
    () =>
      platforms.flatMap((p) =>
        checkPost({ platform: p, caption: captionFor(p), hashtags, title, media, mode, externalAccountId: accounts.find((a) => a.id === accountBy[p])?.external_account_id }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platforms, caption, overrides, hashtags, title, media, mode, accountBy, accounts],
  );
  const errors = issues.filter((i) => i.level === "error");

  const addMediaUrl = () => {
    const v = mediaUrl.trim();
    if (!isHttpUrl(v)) return toast({ title: "That doesn't look like a link", description: "Paste a direct https:// link to an image or video.", variant: "destructive" });
    setMedia((m) => (m.includes(v) ? m : [...m, v]));
    setMediaUrl("");
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!FILE_TYPES.includes(file.type)) { toast({ title: `${file.name} isn't supported`, description: "Use JPG, PNG, WebP, GIF, MP4, MOV or WebM.", variant: "destructive" }); continue; }
      if (file.size > MAX_FILE) { toast({ title: `${file.name} is too large`, description: "The limit is 50 MB per file.", variant: "destructive" }); continue; }
      setUploading((n) => n + 1);
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
      const path = `${clientId}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("postit-media").upload(path, file, { contentType: file.type, upsert: false });
      setUploading((n) => n - 1);
      if (error) {
        toast({ title: `Couldn't upload ${file.name}`, description: /not found|bucket/i.test(error.message) ? "The media bucket isn't set up yet. Run the Post Scheduler migration." : error.message, variant: "destructive" });
        continue;
      }
      const { data } = supabase.storage.from("postit-media").getPublicUrl(path);
      setMedia((m) => [...m, data.publicUrl]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (kind: "draft" | "schedule") => {
    setFormError(null);
    if (platforms.length === 0) return setFormError("Choose at least one platform.");
    const date = fromLocalInput(when);
    if (kind === "schedule") {
      if (!date || Number.isNaN(date.getTime())) return setFormError("Pick a date and time to schedule it, or save it as a draft.");
      if (when !== originalWhen.current && date.getTime() < Date.now() - 60_000) {
        return setFormError("That time has already passed. Pick a future time, or save it as a draft. If it's already live, open the post and choose “Mark as posted”.");
      }
      if (errors.length) return setFormError(`Fix this first: ${errors[0].message}${errors.length > 1 ? ` (and ${errors.length - 1} more below)` : ""}`);
    }
    const group = crypto.randomUUID();
    const rows: Partial<PostitPost>[] = platforms.map((p) => ({
      ...(editing ? {} : { group_id: group }),
      client_id: clientId === INTERNAL_CLIENT ? null : clientId,
      account_id: accountBy[p] || null,
      platform: p,
      title: platformInfo(p).hasTitle ? title.trim() : "",
      caption: captionFor(p).trim(),
      hashtags,
      media_urls: media,
      link_url: link.trim() || null,
      scheduled_at: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
      status: kind === "schedule" ? "scheduled" : "draft",
      publish_mode: mode,
      notes: notes.trim() || null,
      error: null,
      ...(editing && kind === "draft" ? { published_at: null } : {}),
    }));
    setSaving(kind);
    const err = await onSave({ editingId: editing?.id ?? null, rows });
    setSaving(null);
    if (err) setFormError(err);
  };

  const accountDisplay = (p: PlatformKey) => accountFor(p);
  const previewAccount = previewPlatform ? accountDisplay(previewPlatform) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && !o && onClose()}>
      <DialogContent className="max-h-[94dvh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit post" : seed?.copyOf ? "Duplicate post" : "New post"}</DialogTitle>
          <DialogDescription>
            {editing ? `Editing the ${platformInfo(editing.platform).name} version. Other platforms of the same post are separate items.` : "Pick the client and platforms, write once, then customise per platform if you need to."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {/* Client */}
            <div className="space-y-1.5">
              <Label htmlFor="pc-client">Client</Label>
              <Select value={clientId} onValueChange={changeClient} disabled={!!editing}>
                <SelectTrigger id="pc-client"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={INTERNAL_CLIENT}>VAW Technologies (our own pages)</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>{editing ? "Platform" : "Platforms"}</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Platforms">
                {PLATFORMS.map((p) => {
                  const on = platforms.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => togglePlatform(p.key)}
                      disabled={!!editing && !on}
                      aria-pressed={on}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30",
                        on ? "border-primary/60 bg-primary/10 text-white" : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]",
                      )}
                    >
                      <PlatformBadge platform={p.key} /> {p.name}
                    </button>
                  );
                })}
              </div>
              {platforms.length > 0 && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  {platforms.map((p) => {
                    const options = clientAccounts.filter((a) => a.platform === p);
                    return (
                      <div key={p} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="flex w-36 shrink-0 items-center gap-2 text-sm"><PlatformBadge platform={p} /> {platformInfo(p).name}</span>
                        {options.length > 0 ? (
                          <Select value={accountBy[p] || NONE} onValueChange={(v) => setAccountBy((m) => ({ ...m, [p]: v === NONE ? "" : v }))}>
                            <SelectTrigger className="h-9" aria-label={`${platformInfo(p).name} account`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>No account (post manually)</SelectItem>
                              {options.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}{a.handle ? ` (${a.handle})` : ""}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-white/45">No {platformInfo(p).name} account saved for this client. You can still schedule it. Add accounts in the Accounts tab.</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="pc-caption">Caption</Label>
                {platforms.length > 1 && (
                  <div className="flex flex-wrap gap-1" role="tablist" aria-label="Caption version">
                    {(["all", ...platforms] as const).map((t) => (
                      <button
                        key={t}
                        role="tab"
                        aria-selected={tab === t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={cn("rounded-md px-2 py-1 text-[11px] font-semibold", tab === t ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10")}
                      >
                        {t === "all" ? "Same for all" : platformInfo(t).name}{t !== "all" && overrides[t] ? " •" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tab === "all" ? (
                <Textarea id="pc-caption" rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write the caption…" maxLength={20000} />
              ) : (
                <>
                  <Textarea id="pc-caption" rows={6} value={overrides[tab] ?? ""} onChange={(e) => setOverrides((o) => ({ ...o, [tab]: e.target.value }))} placeholder={`Leave empty to use the shared caption on ${platformInfo(tab).name}`} maxLength={20000} />
                  {overrides[tab] && <button type="button" onClick={() => setOverrides((o) => { const n = { ...o }; delete n[tab]; return n; })} className="text-xs text-white/55 underline hover:text-white">Use the shared caption again</button>}
                </>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {platforms.map((p) => {
                  const len = textLength(captionFor(p), hashtags);
                  const lim = platformInfo(p).charLimit;
                  return <span key={p} className={cn("text-[11px] tabular-nums", len > lim ? "font-bold text-red-400" : "text-white/45")}>{platformInfo(p).name} {len.toLocaleString()}/{lim.toLocaleString()}</span>;
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pc-tags">Hashtags</Label>
                <Input id="pc-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#launch #offer" />
                {hashtags.length > 0 && <p className="truncate text-[11px] text-white/45">{hashtagLine(hashtags)}</p>}
              </div>
              {platforms.some((p) => platformInfo(p).hasTitle) && (
                <div className="space-y-1.5">
                  <Label htmlFor="pc-title">Title <span className="text-white/40">(YouTube / Pinterest)</span></Label>
                  <Input id="pc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
                </div>
              )}
              {platforms.some((p) => platformInfo(p).hasLink) && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pc-link">Link <span className="text-white/40">(Pinterest destination, optional elsewhere)</span></Label>
                  <div className="relative"><Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><Input id="pc-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="pl-9" /></div>
                </div>
              )}
            </div>

            {/* Media */}
            <div className="space-y-2">
              <Label>Media</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept={FILE_TYPES.join(",")} multiple className="sr-only" onChange={(e) => upload(e.target.files)} aria-label="Upload media" />
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
                  {uploading > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload image or video
                </Button>
                <div className="flex min-w-[220px] flex-1 gap-2">
                  <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMediaUrl(); } }} placeholder="…or paste a link to a file" className="h-9" aria-label="Media link" />
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={addMediaUrl} aria-label="Add link"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              {media.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {media.map((m) => (
                    <li key={m} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {mediaKind(m) === "video" ? <video src={m} className="h-full w-full object-cover" muted preload="metadata" /> : <img src={m} alt="" className="h-full w-full object-cover" />}
                      <button type="button" onClick={() => setMedia((x) => x.filter((y) => y !== m))} aria-label="Remove media" className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white opacity-90 hover:bg-red-600"><X className="h-3 w-3" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-white/40">JPG, PNG, WebP, GIF, MP4, MOV, WebM up to 50 MB each.</p>
            </div>

            {/* When */}
            <div className="space-y-2">
              <Label htmlFor="pc-when">Publish at</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input id="pc-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-auto" />
                {quickSlots().map((s) => (
                  <button key={s.label} type="button" onClick={() => setWhen(toLocalInput(s.date))} className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10">{s.label}</button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="How it gets published">
                {([
                  { v: "manual", t: "Remind us to post it", d: "It shows as due at the time and someone posts it, then marks it as posted." },
                  { v: "auto", t: "Auto-publish", d: "Posted automatically. Needs media and a provider account ID on the account." },
                ] as const).map((o) => (
                  <button key={o.v} type="button" role="radio" aria-checked={mode === o.v} onClick={() => setMode(o.v)} className={cn("rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", mode === o.v ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")}>
                    <p className="text-sm font-bold">{o.t}</p>
                    <p className="text-xs text-white/55">{o.d}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-notes">Internal notes <span className="text-white/40">(never published)</span></Label>
              <Textarea id="pc-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
            </div>

            {issues.length > 0 && (
              <ul className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs" aria-live="polite">
                {issues.map((i, n) => (
                  <li key={n} className={cn("flex items-start gap-2", i.level === "error" ? "text-amber-200" : "text-white/60")}><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />{i.message}</li>
                ))}
                <li className="pt-1 text-white/40">Drafts can be saved with issues; scheduling needs them fixed.</li>
              </ul>
            )}
          </div>

          {/* Preview */}
          <aside className="space-y-3 lg:sticky lg:top-0 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Preview{previewPlatform ? ` · ${platformInfo(previewPlatform).name}` : ""}</p>
            {previewPlatform ? (
              <PostPreview
                platform={previewPlatform}
                accountName={previewAccount?.account_name ?? (clientId === INTERNAL_CLIENT ? "VAW Technologies" : clients.find((c) => c.id === clientId)?.company_name ?? "")}
                handle={previewAccount?.handle}
                title={title}
                caption={captionFor(previewPlatform)}
                hashtags={hashtags}
                media={media}
                link={link}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45">Choose a platform to see a preview.</div>
            )}
            {when && fromLocalInput(when) && !Number.isNaN(fromLocalInput(when)!.getTime()) && (
              <p className="flex items-center gap-2 text-xs text-white/55"><CalendarClock className="h-4 w-4" /> {format(fromLocalInput(when)!, "EEE d MMM yyyy, h:mm a")}</p>
            )}
          </aside>
        </div>

        {formError && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{formError}</p>}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={!!saving}>Cancel</Button>
          <Button variant="outline" onClick={() => submit("draft")} disabled={!!saving || uploading > 0} className="gap-2">
            {saving === "draft" && <Loader2 className="h-4 w-4 animate-spin" />} Save as draft
          </Button>
          <Button onClick={() => submit("schedule")} disabled={!!saving || uploading > 0} className="gap-2">
            {saving === "schedule" && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save & schedule" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
