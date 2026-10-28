import { useMemo, useState } from "react";
import { ExternalLink, Loader2, Plus, Trash2, Unplug, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PLATFORMS, platformInfo } from "@/lib/postit/platforms";
import { isHttpUrl } from "@/lib/postit/schedule";
import { ALL_CLIENTS, INTERNAL_CLIENT, type ClientLite, type PlatformKey, type PostitAccount } from "@/lib/postit/types";
import { cn } from "@/lib/utils";
import { EmptyState, PlatformBadge } from "./postitUi";
import { Share2 } from "lucide-react";

interface Props {
  clients: ClientLite[];
  accounts: PostitAccount[];
  clientFilter: string;
  canDelete: boolean;
  onCreate: (row: Partial<PostitAccount>) => Promise<string | null>;
  onUpdate: (id: string, patch: Partial<PostitAccount>) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}

interface Draft { client: string; platform: PlatformKey; name: string; handle: string; url: string; external: string }

export const AccountsPanel = ({ clients, accounts, clientFilter, canDelete, onCreate, onUpdate, onDelete }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<PostitAccount | null>(null);
  const [draft, setDraft] = useState<Draft>({ client: INTERNAL_CLIENT, platform: "instagram", name: "", handle: "", url: "", external: "" });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const groups = useMemo(() => {
    const visible = accounts.filter((a) => clientFilter === ALL_CLIENTS || (clientFilter === INTERNAL_CLIENT ? a.client_id === null : a.client_id === clientFilter));
    const map = new Map<string, PostitAccount[]>();
    visible.forEach((a) => (map.get(a.client_id ?? INTERNAL_CLIENT) ?? map.set(a.client_id ?? INTERNAL_CLIENT, []).get(a.client_id ?? INTERNAL_CLIENT)!).push(a));
    const nameOf = (id: string) => (id === INTERNAL_CLIENT ? "VAW Technologies" : clients.find((c) => c.id === id)?.company_name ?? "Unknown client");
    return [...map.entries()].map(([id, list]) => ({ id, name: nameOf(id), list })).sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, clients, clientFilter]);

  const openNew = () => {
    setDraft({ client: clientFilter === ALL_CLIENTS ? INTERNAL_CLIENT : clientFilter, platform: "instagram", name: "", handle: "", url: "", external: "" });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return toast({ title: "Add an account name", description: "For example the page or channel name.", variant: "destructive" });
    if (draft.url.trim() && !isHttpUrl(draft.url)) return toast({ title: "Profile link must start with https://", variant: "destructive" });
    setSaving(true);
    const err = await onCreate({
      client_id: draft.client === INTERNAL_CLIENT ? null : draft.client,
      platform: draft.platform,
      account_name: draft.name.trim(),
      handle: draft.handle.trim() || null,
      profile_url: draft.url.trim() || null,
      external_account_id: draft.external.trim() || null,
    });
    setSaving(false);
    if (err) return toast({ title: "Couldn't add the account", description: err, variant: "destructive" });
    toast({ title: "Account added" });
    setOpen(false);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    const err = await onDelete(target.id);
    if (err) toast({ title: "Couldn't remove the account", description: err, variant: "destructive" });
    else toast({ title: "Account removed", description: "Posts that used it stay in the calendar without an account." });
  };

  const toggleStatus = async (a: PostitAccount) => {
    const err = await onUpdate(a.id, { status: a.status === "active" ? "disconnected" : "active" });
    if (err) toast({ title: "Couldn't update the account", description: err, variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-white/60">The social profiles we post to for each client. Add a profile once, then pick it when writing a post. No passwords are stored here.</p>
        <Button size="sm" onClick={openNew} className="gap-2 self-start"><Plus className="h-4 w-4" /> Add account</Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Share2} title="No accounts yet" body="Add each client's Instagram, Facebook, LinkedIn and other profiles so posts can be planned against them." action={<Button size="sm" onClick={openNew}>Add the first account</Button>} />
      ) : (
        groups.map((g) => (
          <section key={g.id} className="space-y-2">
            <h3 className="text-sm font-bold text-white/80">{g.name} <span className="font-normal text-white/40">· {g.list.length}</span></h3>
            <ul className="grid gap-2 md:grid-cols-2">
              {g.list.map((a) => (
                <li key={a.id} className={cn("flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3", a.status === "disconnected" && "opacity-60")}>
                  <PlatformBadge platform={a.platform} className="h-8 min-w-8 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{a.account_name}</p>
                    <p className="truncate text-xs text-white/50">{platformInfo(a.platform).name}{a.handle ? ` · ${a.handle}` : ""}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {a.external_account_id && <Badge variant="outline" className="gap-1 border-violet-500/30 text-[10px] text-violet-300"><Zap className="h-3 w-3" /> Auto-publish ready</Badge>}
                      {a.status === "disconnected" && <Badge variant="outline" className="border-white/15 text-[10px] text-white/55">Paused</Badge>}
                    </div>
                  </div>
                  {a.profile_url && <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Open profile"><a href={a.profile_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(a)} aria-label={a.status === "active" ? "Pause account" : "Resume account"} title={a.status === "active" ? "Pause (hide from the post form)" : "Resume"}><Unplug className="h-4 w-4" /></Button>
                  {canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" onClick={() => setToDelete(a)} aria-label="Remove account"><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
            <DialogDescription>Which profile do we post to, and for which client?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ac-client">Client</Label>
              <Select value={draft.client} onValueChange={(v) => set("client", v)}>
                <SelectTrigger id="ac-client"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={INTERNAL_CLIENT}>VAW Technologies (our own pages)</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-platform">Platform</Label>
              <Select value={draft.platform} onValueChange={(v) => set("platform", v as PlatformKey)}>
                <SelectTrigger id="ac-platform"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="ac-name">Account name *</Label><Input id="ac-name" value={draft.name} maxLength={120} onChange={(e) => set("name", e.target.value)} placeholder="Acme Bakery" /></div>
              <div className="space-y-1.5"><Label htmlFor="ac-handle">Handle</Label><Input id="ac-handle" value={draft.handle} maxLength={120} onChange={(e) => set("handle", e.target.value)} placeholder="@acmebakery" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="ac-url">Profile link</Label><Input id="ac-url" value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder="https://instagram.com/acmebakery" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-ext">Provider account ID <span className="text-white/40">(optional)</span></Label>
              <Input id="ac-ext" value={draft.external} maxLength={120} onChange={(e) => set("external", e.target.value)} />
              <p className="text-[11px] text-white/45">Only for auto-publishing: the ID this profile has at the publishing service (MuAPI). Leave empty to post by hand.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Add account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this account?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete ? `“${toDelete.account_name}” will be removed. Existing posts stay in the calendar. To just hide it from the post form, pause it instead.` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
