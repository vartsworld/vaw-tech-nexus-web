import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Building, Check, Copy, Download, Edit, ExternalLink, Key, Layers, Loader2, Mail, MoreVertical, Phone, Plus, QrCode, RefreshCw, Search, Shield, Trash2, User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;
const portalUrl = () => `${window.location.origin}/portal`;

const ICONS = [
  { value: "layers", label: "Default", Icon: Layers },
  { value: "user", label: "Profile", Icon: User },
  { value: "card", label: "ID card", Icon: Building },
  { value: "shield", label: "Secure", Icon: Shield },
  { value: "key", label: "Credentials", Icon: Key },
];

const QRManagement = () => {
  const { toast } = useToast();
  const [portals, setPortals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [newPortal, setNewPortal] = useState({ client_id: "", description: "" });
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<any>(null);
  const [editDescription, setEditDescription] = useState("");

  const [pagesFor, setPagesFor] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  const [qrFor, setQrFor] = useState<any>(null);
  const qrWrap = useRef<HTMLDivElement>(null);
  const [toRemove, setToRemove] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        db.from("client_portals").select("*, client:clients(*), portal_links:portal_links(count)").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, company_name, email, phone").order("company_name"),
      ]);
      if (p.error) throw p.error;
      setPortals(p.data || []);
      setClients(c.data || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Could not load portals", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return portals;
    return portals.filter((p) => [p.client?.company_name, p.client?.email, p.client?.phone, p.description].some((v) => (v || "").toLowerCase().includes(q)));
  }, [portals, search]);

  const stats = useMemo(() => {
    const withPortal = new Set(portals.map((p) => p.client_id));
    return {
      portals: portals.length,
      pages: portals.reduce((t, p) => t + (p.portal_links?.[0]?.count || 0), 0),
      without: clients.filter((c) => !withPortal.has(c.id)).length,
    };
  }, [portals, clients]);

  const availableClients = clients.filter((c) => !portals.some((p) => p.client_id === c.id));

  const addPortal = async () => {
    if (!newPortal.client_id) return toast({ title: "Pick a client first", variant: "destructive" });
    setSaving(true);
    try {
      const { data, error } = await db.from("client_portals").insert([newPortal]).select("*, client:clients(*), portal_links:portal_links(count)");
      if (error) throw error;
      setPortals((prev) => [data[0], ...prev]);
      setAddOpen(false);
      setNewPortal({ client_id: "", description: "" });
      toast({ title: "Portal created", description: "Now add the pages the client should see." });
    } catch (e: any) {
      toast({ title: "Could not create portal", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveDescription = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { error } = await db.from("client_portals").update({ description: editDescription }).eq("id", editing.id);
      if (error) throw error;
      setPortals((prev) => prev.map((p) => (p.id === editing.id ? { ...p, description: editDescription } : p)));
      setEditing(null);
      toast({ title: "Description updated" });
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removePortal = async () => {
    if (!toRemove) return;
    try {
      const { error } = await db.from("client_portals").delete().eq("id", toRemove.id);
      if (error) throw error;
      setPortals((prev) => prev.filter((p) => p.id !== toRemove.id));
      toast({ title: "Portal removed", description: `${toRemove.client?.company_name} no longer has a portal.` });
    } catch (e: any) {
      toast({ title: "Could not remove", description: e.message, variant: "destructive" });
    } finally {
      setToRemove(null);
    }
  };

  const openPages = async (portal: any) => {
    setPagesFor(portal);
    setLinksLoading(true);
    const { data, error } = await db.from("portal_links").select("*").eq("client_id", portal.client_id).order("created_at", { ascending: true });
    if (error) toast({ title: "Could not load pages", description: error.message, variant: "destructive" });
    setLinks(data || []);
    setLinksLoading(false);
  };

  const refreshCount = (clientId: string, count: number) =>
    setPortals((prev) => prev.map((p) => (p.client_id === clientId ? { ...p, portal_links: [{ count }] } : p)));

  const addLink = async () => {
    const { data, error } = await db.from("portal_links").insert([{ client_id: pagesFor.client_id, title: "New page", url: "", description: "", icon: "layers", page_id: "", password: "", is_active: true }]).select();
    if (error) return toast({ title: "Could not add page", description: error.message, variant: "destructive" });
    const next = [...links, data[0]];
    setLinks(next);
    refreshCount(pagesFor.client_id, next.length);
  };

  const updateLink = async (id: string, updates: any) => {
    const { error } = await db.from("portal_links").update(updates).eq("id", id);
    if (error) return toast({ title: "Change not saved", description: error.message, variant: "destructive" });
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLink = async (id: string) => {
    const { error } = await db.from("portal_links").delete().eq("id", id);
    if (error) return toast({ title: "Could not remove page", description: error.message, variant: "destructive" });
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    refreshCount(pagesFor.client_id, next.length);
  };

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${label} copied` }); } catch { toast({ title: "Copy failed", variant: "destructive" }); }
  };

  const downloadQr = () => {
    const canvas = qrWrap.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${(qrFor?.client?.company_name || "portal").replace(/\s+/g, "-").toLowerCase()}-portal-qr.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">QR & Client Portals</h1>
          <p className="text-sm text-muted-foreground">Give each client a portal with the pages and logins they need, and share it with a QR code.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2 border-white/10 bg-white/5"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add client portal</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Client portals", value: stats.portals, hint: "clients with a portal", Icon: Building, tone: "text-amber-400" },
          { label: "Pages published", value: stats.pages, hint: "links across all portals", Icon: Layers, tone: "text-sky-400" },
          { label: "Clients without a portal", value: stats.without, hint: "could be added", Icon: QrCode, tone: "text-violet-400" },
        ].map(({ label, value, hint, Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-card/70 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><Icon className={`h-3.5 w-3.5 ${tone}`} /> {label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{loading ? "–" : value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      <Card className="rounded-2xl border-white/10 bg-card/70">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client, email, phone or description" className="pl-9" aria-label="Search portals" />
          </div>

          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 p-10 text-center">
              <Layers className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="font-semibold">{portals.length === 0 ? "No client portals yet" : "No portal matches your search"}</p>
              <p className="text-sm text-muted-foreground">{portals.length === 0 ? "Add a client to create their first portal." : "Try a different name or email."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {filtered.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400"><Building className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.client?.company_name || "Unknown client"}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.description || "Client workspace"}</p>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-0.5 text-xs text-muted-foreground sm:w-56">
                    {p.client?.email && <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" />{p.client.email}</p>}
                    {p.client?.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{p.client.phone}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Badge variant="outline" className="border-white/15">{p.portal_links?.[0]?.count || 0} pages</Badge>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-9 gap-1.5 border-white/10 bg-white/5" onClick={() => openPages(p)}><Layers className="h-4 w-4" /> Pages</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-9 w-9" aria-label={`Actions for ${p.client?.company_name}`}><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => openPages(p)}><Layers className="mr-2 h-4 w-4" /> Manage pages</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrFor(p)}><QrCode className="mr-2 h-4 w-4" /> Show QR code</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copy(portalUrl(), "Portal link")}><Copy className="mr-2 h-4 w-4" /> Copy portal link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open("/portal", "_blank", "noopener")}><ExternalLink className="mr-2 h-4 w-4" /> Open portal</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditing(p); setEditDescription(p.description || ""); }}><Edit className="mr-2 h-4 w-4" /> Edit description</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => setToRemove(p)}><Trash2 className="mr-2 h-4 w-4" /> Remove portal</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="dark sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a client portal</DialogTitle>
            <DialogDescription>Choose a client from your records. You can add pages right after.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={newPortal.client_id} onValueChange={(v) => setNewPortal({ ...newPortal, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent className="dark max-h-72">
                  {availableClients.length ? availableClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}<span className="ml-2 text-xs text-muted-foreground">{c.email || c.phone || ""}</span></SelectItem>
                  )) : <div className="p-3 text-center text-sm text-muted-foreground">Every client already has a portal.</div>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={newPortal.description} onChange={(e) => setNewPortal({ ...newPortal, description: e.target.value })} placeholder="e.g. Website project portal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addPortal} disabled={saving || !newPortal.client_id}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create portal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit description */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="dark sm:max-w-md">
          <DialogHeader><DialogTitle>Edit description</DialogTitle><DialogDescription>{editing?.client?.company_name}</DialogDescription></DialogHeader>
          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="What is this portal for?" autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveDescription} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR */}
      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="dark sm:max-w-sm">
          <DialogHeader><DialogTitle>Portal QR code</DialogTitle><DialogDescription>Scan to open the client portal sign-in page.</DialogDescription></DialogHeader>
          <div ref={qrWrap} className="mx-auto rounded-2xl bg-white p-4"><QRCodeCanvas value={portalUrl()} size={220} level="M" includeMargin={false} /></div>
          <p className="break-all text-center text-xs text-muted-foreground">{portalUrl()}</p>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => copy(portalUrl(), "Portal link")} className="gap-2"><Copy className="h-4 w-4" /> Copy link</Button>
            <Button onClick={downloadQr} className="gap-2"><Download className="h-4 w-4" /> Download PNG</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pages */}
      <Dialog open={!!pagesFor} onOpenChange={(o) => !o && setPagesFor(null)}>
        <DialogContent className="dark flex max-h-[88vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Portal pages</DialogTitle>
            <DialogDescription>Pages {pagesFor?.client?.company_name} sees in their portal. Changes save when you leave a field.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {linksLoading ? <Skeleton className="h-40 rounded-xl" /> : links.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">No pages yet. Add the first one.</p>
            ) : links.map((link) => (
              <div key={link.id} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
                  <div className="space-y-1.5"><Label className="text-xs">Title</Label><Input defaultValue={link.title} onBlur={(e) => e.target.value !== link.title && updateLink(link.id, { title: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Icon</Label>
                    <Select value={link.icon || "layers"} onValueChange={(v) => updateLink(link.id, { icon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="dark">{ICONS.map(({ value, label, Icon }) => <SelectItem key={value} value={value}><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span></SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Link</Label><Input defaultValue={link.url} placeholder="https://" onBlur={(e) => e.target.value !== link.url && updateLink(link.id, { url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Short description</Label><Input defaultValue={link.description} onBlur={(e) => e.target.value !== link.description && updateLink(link.id, { description: e.target.value })} /></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label className="text-xs">Login / user ID</Label><Input defaultValue={link.page_id || ""} onBlur={(e) => e.target.value !== (link.page_id || "") && updateLink(link.id, { page_id: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Password / key</Label><Input defaultValue={link.password || ""} onBlur={(e) => e.target.value !== (link.password || "") && updateLink(link.id, { password: e.target.value })} /></div>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={!!link.is_active} onCheckedChange={(v) => updateLink(link.id, { is_active: v })} /> Visible to client</label>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-red-500 hover:bg-red-500/10 hover:text-red-500" onClick={() => deleteLink(link.id)}><Trash2 className="h-4 w-4" /> Remove</Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={addLink} className="gap-2"><Plus className="h-4 w-4" /> Add page</Button>
            <Button onClick={() => setPagesFor(null)} className="gap-2"><Check className="h-4 w-4" /> Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove */}
      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent className="dark">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toRemove?.client?.company_name}'s portal?</AlertDialogTitle>
            <AlertDialogDescription>The client loses access to the portal. Their client record is not affected. Pages are kept in the database but are no longer listed here.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removePortal} className="bg-red-600 text-white hover:bg-red-700">Remove portal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QRManagement;
