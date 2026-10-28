import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDays, endOfMonth, format, isSameDay, isSameMonth, isToday, isTomorrow, startOfDay, startOfMonth } from "date-fns";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, Search, Share2, X } from "lucide-react";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import { AccountsPanel } from "@/components/postit/AccountsPanel";
import { PostCalendar, calendarRange, nextCursor } from "@/components/postit/PostCalendar";
import { PostRow, type PostActions } from "@/components/postit/PostCard";
import { PostComposer, type ComposerResult, type ComposerSeed } from "@/components/postit/PostComposer";
import { EmptyState, ErrorCard, SetupNotice, SkeletonRows, StatTile } from "@/components/postit/postitUi";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { explainPostitError, usePostit } from "@/hooks/usePostit";
import { supabase } from "@/integrations/supabase/client";
import { PLATFORMS } from "@/lib/postit/platforms";
import { defaultSlot, fullText, isDue, isHttpUrl, postDate } from "@/lib/postit/schedule";
import { ALL_CLIENTS, INTERNAL_CLIENT, type PostitPost } from "@/lib/postit/types";
import { cn } from "@/lib/utils";

type Tab = "calendar" | "list" | "accounts";
type ListFilter = "all" | "due" | "scheduled" | "draft" | "published" | "failed";
const MANAGER_ROLES = ["hr", "manager", "lead", "admin", "super_admin", "department_head", "team_head"];
const CLIENT_KEY = "postit.client";

const PostScheduler = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const data = usePostit();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});

  const [tab, setTab] = useState<Tab>("calendar");
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());
  const [clientFilter, setClientFilter] = useState<string>(() => params.get("client") || localStorage.getItem(CLIENT_KEY) || ALL_CLIENTS);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [query, setQuery] = useState("");
  const [seed, setSeed] = useState<ComposerSeed | null>(null);
  const [toDelete, setToDelete] = useState<PostitPost | null>(null);
  const [markFor, setMarkFor] = useState<PostitPost | null>(null);
  const [markUrl, setMarkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAllPosted, setShowAllPosted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Auth + profile (same approach as the monthly planner page)
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate("/staff/login", { replace: true }); return; }
        setUser(session.user);
        const { data: p } = await supabase.from("staff_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
        setProfile(p);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [navigate]);

  const username = profile?.username as string | undefined;
  useEffect(() => {
    if (!profile?.user_id || !profile?.full_name) return;
    const channel = supabase.channel("team-presence");
    channel
      .on("presence", { event: "sync" }, () => setOnlineUsers(channel.presenceState()))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: profile.user_id, full_name: profile.full_name, username: username || "user", online_at: new Date().toISOString() });
      });
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id, profile?.full_name, username]);

  // "Due now" must update while the page stays open
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { localStorage.setItem(CLIENT_KEY, clientFilter); }, [clientFilter]);
  useEffect(() => { document.title = "Post Scheduler · VAW"; }, []);

  const isManager = !!profile && (MANAGER_ROLES.includes(profile.role) || !!profile.is_department_head);
  const { posts, accounts, clients, clientName, people } = data;

  // Stale client filter (client deleted) falls back to all
  useEffect(() => {
    if (!data.loading && clientFilter !== ALL_CLIENTS && clientFilter !== INTERNAL_CLIENT && clients.length > 0 && !clients.some((c) => c.id === clientFilter)) setClientFilter(ALL_CLIENTS);
  }, [data.loading, clients, clientFilter]);

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (clientFilter === INTERNAL_CLIENT ? p.client_id !== null : clientFilter !== ALL_CLIENTS && p.client_id !== clientFilter) return false;
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (q && ![p.caption, p.title, p.notes ?? "", clientName(p.client_id)].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, clientFilter, platformFilter, query, clientName]);

  const stats = useMemo(() => {
    const monthStart = startOfMonth(now), monthEnd = endOfMonth(now);
    return {
      due: scoped.filter((p) => isDue(p, now) && p.publish_mode === "manual").length,
      upcoming: scoped.filter((p) => p.status === "scheduled" && !isDue(p, now)).length,
      drafts: scoped.filter((p) => p.status === "draft").length,
      postedMonth: scoped.filter((p) => p.status === "published" && (postDate(p)?.getTime() ?? 0) >= +monthStart && (postDate(p)?.getTime() ?? 0) <= +monthEnd).length,
      failed: scoped.filter((p) => p.status === "failed").length,
    };
  }, [scoped, now]);

  const accountOf = useCallback((p: PostitPost) => accounts.find((a) => a.id === p.account_id) ?? null, [accounts]);
  const canPublishNow = useCallback(
    (p: PostitPost) => p.publish_mode === "auto" && (p.status === "scheduled" || p.status === "failed") && p.media_urls.length > 0 && !!accountOf(p)?.external_account_id,
    [accountOf],
  );

  /* ---------- actions ---------- */
  const actions: PostActions = {
    edit: (p) => setSeed({ post: p }),
    duplicate: (p) => setSeed({ copyOf: { ...p, scheduled_at: null }, date: p.scheduled_at ? addDays(new Date(p.scheduled_at), 1) : undefined }),
    copy: async (p) => {
      try { await navigator.clipboard.writeText(fullText(p.caption, p.hashtags)); toast({ title: "Caption copied", description: "Paste it into the platform." }); }
      catch { toast({ title: "Couldn't copy", description: "Select the text in the editor and copy it manually.", variant: "destructive" }); }
    },
    markPosted: (p) => { setMarkFor(p); setMarkUrl(""); },
    retry: async (p) => {
      const err = await data.updatePost(p.id, { status: "scheduled", scheduled_at: new Date(Date.now() + 60_000).toISOString(), error: null, request_id: null });
      toast(err ? { title: "Couldn't retry", description: explainPostitError(err), variant: "destructive" } : { title: "Queued again", description: "It will go out in about a minute." });
    },
    publishNow: async (p) => {
      setBusy(true);
      const { data: res, error } = await supabase.functions.invoke("postit-publish", { body: { postId: p.id } });
      setBusy(false);
      if (error || res?.error) {
        toast({ title: "Couldn't publish", description: res?.error || "Auto-publishing isn't set up yet. Ask an admin to deploy the postit-publish function (see docs/POST_SCHEDULER.md).", variant: "destructive" });
      } else {
        toast({ title: "Sent for publishing", description: "The status updates here when the network confirms." });
        data.reload();
      }
    },
    toDraft: async (p) => {
      const err = await data.updatePost(p.id, { status: "draft" });
      toast(err ? { title: "Couldn't update", description: explainPostitError(err), variant: "destructive" } : { title: "Moved back to draft" });
    },
    remove: (p) => setToDelete(p),
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    const err = await data.deletePost(target.id);
    toast(err ? { title: "Couldn't delete", description: explainPostitError(err), variant: "destructive" } : { title: "Post deleted" });
  };

  const confirmMarkPosted = async () => {
    if (!markFor) return;
    if (markUrl.trim() && !isHttpUrl(markUrl)) return toast({ title: "The link must start with https://", variant: "destructive" });
    const target = markFor;
    setBusy(true);
    const err = await data.updatePost(target.id, { status: "published", published_at: new Date().toISOString(), published_url: markUrl.trim() || null, error: null });
    setBusy(false);
    if (err) return toast({ title: "Couldn't update", description: explainPostitError(err), variant: "destructive" });
    setMarkFor(null);
    toast({ title: "Marked as posted" });
  };

  const handleSave = async ({ editingId, rows }: ComposerResult): Promise<string | null> => {
    const err = editingId ? await data.updatePost(editingId, rows[0]) : await data.createPosts(rows);
    if (err) return explainPostitError(err);
    const first = rows[0];
    const scheduled = first.status === "scheduled";
    toast({
      title: editingId ? "Post updated" : scheduled ? `Scheduled on ${rows.length} platform${rows.length === 1 ? "" : "s"}` : "Draft saved",
      description: first.scheduled_at ? format(new Date(first.scheduled_at), "EEE d MMM, h:mm a") : undefined,
    });
    if (first.scheduled_at) { const d = new Date(first.scheduled_at); setCursor(d); setSelectedDay(d); }
    setSeed(null);
    return null;
  };

  const handleMove = async (postId: string, day: Date) => {
    const p = posts.find((x) => x.id === postId);
    if (!p || !p.scheduled_at) return;
    if (p.status !== "draft" && p.status !== "scheduled") return toast({ title: "This post can't be moved", description: p.status === "published" ? "It has already been posted." : undefined, variant: "destructive" });
    if (startOfDay(day) < startOfDay(new Date())) return toast({ title: "Pick today or a later day", variant: "destructive" });
    const old = new Date(p.scheduled_at);
    let next = new Date(day); next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    if (next.getTime() < Date.now()) next = defaultSlot(day);
    if (isSameDay(next, old) && next.getTime() === old.getTime()) return;
    const err = await data.updatePost(p.id, { scheduled_at: next.toISOString() });
    toast(err ? { title: "Couldn't reschedule", description: explainPostitError(err), variant: "destructive" } : { title: "Rescheduled", description: format(next, "EEE d MMM, h:mm a") });
  };

  const openNew = (date?: Date) => setSeed({ date: date ? defaultSlot(date) : undefined, clientId: clientFilter !== ALL_CLIENTS ? clientFilter : undefined });
  const openFromCalendar = (p: PostitPost) => {
    if (p.status === "published" || p.status === "publishing") { const d = postDate(p); if (d) setSelectedDay(d); return; }
    actions.edit(p);
  };

  /* ---------- list view model ---------- */
  const listGroups = useMemo(() => {
    const match = (p: PostitPost) =>
      listFilter === "all" ? true : listFilter === "due" ? isDue(p, now) || p.status === "failed" : p.status === listFilter;
    const items = scoped.filter(match);
    const groups: { key: string; label: string; tone?: string; posts: PostitPost[] }[] = [];
    const attention = items.filter((p) => (isDue(p, now) && p.publish_mode === "manual") || p.status === "failed");
    if (attention.length) groups.push({ key: "attention", label: "Needs attention", tone: "text-amber-300", posts: attention });
    const rest = items.filter((p) => !attention.includes(p));
    const upcoming = rest.filter((p) => p.status !== "published" && p.scheduled_at).sort((a, b) => +new Date(a.scheduled_at!) - +new Date(b.scheduled_at!));
    const byDay = new Map<string, PostitPost[]>();
    upcoming.forEach((p) => { const k = format(new Date(p.scheduled_at!), "yyyy-MM-dd"); (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(p); });
    byDay.forEach((list, k) => {
      const d = new Date(`${k}T00:00:00`);
      groups.push({ key: k, label: isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEEE, d MMMM"), posts: list });
    });
    const unscheduled = rest.filter((p) => p.status !== "published" && !p.scheduled_at);
    if (unscheduled.length) groups.push({ key: "undated", label: "Drafts without a date", posts: unscheduled });
    const posted = rest.filter((p) => p.status === "published").sort((a, b) => +(postDate(b) ?? 0) - +(postDate(a) ?? 0));
    if (posted.length) groups.push({ key: "posted", label: "Posted", posts: showAllPosted ? posted : posted.slice(0, 20) });
    return { groups, postedTotal: posted.length };
  }, [scoped, listFilter, now, showAllPosted]);

  const dayPosts = useMemo(() => (selectedDay ? scoped.filter((p) => { const d = postDate(p); return d && isSameDay(d, selectedDay); }).sort((a, b) => +new Date(a.scheduled_at ?? 0) - +new Date(b.scheduled_at ?? 0)) : []), [scoped, selectedDay]);

  const goStat = (f: ListFilter) => { setListFilter(f); setTab("list"); };
  const showClientOnChips = clientFilter === ALL_CLIENTS;
  const range = calendarRange(calView, cursor);
  const title = calView === "month" ? format(cursor, "MMMM yyyy") : `${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")}`;

  const dashboard = profile && (profile.role === "manager" || profile.role === "lead" || profile.is_department_head) ? "/team-head" : "/staff";

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-zinc-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  if (!user || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Please sign in as staff to use the Post Scheduler.</p>
        <Button onClick={() => navigate("/staff/login")}>Go to staff login</Button>
      </div>
    );
  }

  const postRow = (p: PostitPost, showDate?: boolean) => (
    <PostRow key={p.id} post={p} clientName={clientName(p.client_id)} creator={p.created_by ? people[p.created_by] : undefined} account={accountOf(p)} actions={actions} canPublishNow={canPublishNow(p)} showDate={showDate} />
  );

  return (
    <VirtualOfficeLayout
      currentRoom="postit"
      onRoomChange={(room) => navigate(`${dashboard}?${room === "workspace" ? "dashboard" : room === "planner" ? "calendar" : room}`)}
      onlineUsers={onlineUsers}
      userId={user.id}
      userProfile={profile}
    >
      <div className="mx-auto max-w-7xl space-y-5 pb-24 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl"><CalendarClock className="h-7 w-7 text-primary" /> Post Scheduler</h1>
            <p className="text-sm text-white/55">Plan, schedule and track social posts for every client in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="min-w-0 flex-1 sm:w-64 sm:flex-none" aria-label="Client"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CLIENTS}>All clients</SelectItem>
                <SelectItem value={INTERNAL_CLIENT}>VAW Technologies</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => openNew()} className="shrink-0 gap-2" disabled={!data.available}><Plus className="h-4 w-4" /> New post</Button>
          </div>
        </div>

        {!data.available ? (
          <SetupNotice />
        ) : data.error ? (
          <ErrorCard message={data.error} onRetry={data.reload} />
        ) : (
          <>
            {/* Stats */}
            <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 [&>*]:min-w-[150px] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:min-w-0">
              <StatTile label="Time to post" value={stats.due} hint={stats.due ? "waiting for someone" : "nothing due"} tone={stats.due ? "text-amber-400" : undefined} onClick={() => goStat("due")} />
              <StatTile label="Scheduled" value={stats.upcoming} hint="coming up" onClick={() => goStat("scheduled")} />
              <StatTile label="Drafts" value={stats.drafts} onClick={() => goStat("draft")} />
              <StatTile label="Posted this month" value={stats.postedMonth} tone="text-emerald-400" onClick={() => goStat("published")} />
              <StatTile label="Failed" value={stats.failed} tone={stats.failed ? "text-red-400" : undefined} onClick={() => goStat("failed")} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                  <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Calendar</TabsTrigger>
                  <TabsTrigger value="list" className="gap-1.5">List</TabsTrigger>
                  <TabsTrigger value="accounts" className="gap-1.5"><Share2 className="h-4 w-4" /> Accounts</TabsTrigger>
                </TabsList>
              </Tabs>
              {tab !== "accounts" && (
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-[150px] flex-1 sm:w-56 sm:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" className="h-9 pl-9" aria-label="Search posts" />
                    {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
                  </div>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="h-9 w-40 sm:w-44" aria-label="Platform"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      {PLATFORMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {tab === "list" && (
                    <Select value={listFilter} onValueChange={(v) => setListFilter(v as ListFilter)}>
                      <SelectTrigger className="h-9 w-40 sm:w-44" aria-label="Status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="due">Needs attention</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                        <SelectItem value="published">Posted</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => data.reload()} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button>
                </div>
              )}
            </div>

            {data.loading ? (
              <SkeletonRows />
            ) : tab === "calendar" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCursor((c) => nextCursor(calView, c, -1))} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCursor((c) => nextCursor(calView, c, 1))} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="ml-1 h-9" onClick={() => { setCursor(new Date()); setSelectedDay(new Date()); }}>Today</Button>
                    <h2 className="ml-3 text-lg font-bold text-white">{title}</h2>
                  </div>
                  <Tabs value={calView} onValueChange={(v) => setCalView(v as "month" | "week")}>
                    <TabsList className="h-9"><TabsTrigger value="month" className="px-3 py-1 text-xs">Month</TabsTrigger><TabsTrigger value="week" className="px-3 py-1 text-xs">Week</TabsTrigger></TabsList>
                  </Tabs>
                </div>
                <PostCalendar
                  view={calView}
                  cursor={cursor}
                  posts={scoped}
                  selectedDay={selectedDay}
                  clientLabel={showClientOnChips ? (p) => clientName(p.client_id) : undefined}
                  canDrag={(p) => (p.status === "draft" || p.status === "scheduled") && !!p.scheduled_at}
                  onSelectDay={(d) => { setSelectedDay(d); if (calView === "month" && !isSameMonth(d, cursor)) setCursor(d); }}
                  onCreate={openNew}
                  onOpenPost={openFromCalendar}
                  onMove={handleMove}
                />
                <p className="hidden text-[11px] text-white/40 sm:block">Tip: drag a post to another day to reschedule it. Double-click a day to start a post.</p>
                {selectedDay && (
                  <section className="space-y-3" aria-label={`Posts on ${format(selectedDay, "d MMMM")}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white/80">{isToday(selectedDay) ? "Today" : format(selectedDay, "EEEE, d MMMM")} <span className="font-normal text-white/40">· {dayPosts.length} post{dayPosts.length === 1 ? "" : "s"}</span></h3>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => openNew(selectedDay)}><Plus className="h-3.5 w-3.5" /> Add post</Button>
                    </div>
                    {dayPosts.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-white/40">Nothing planned for this day.</p> : <div className="space-y-2">{dayPosts.map((p) => postRow(p))}</div>}
                  </section>
                )}
              </div>
            ) : tab === "list" ? (
              listGroups.groups.length === 0 ? (
                <EmptyState icon={CalendarClock} title={posts.length === 0 ? "No posts yet" : "No posts match these filters"} body={posts.length === 0 ? "Create the first post and pick the client and platforms it's for." : "Try another client, platform or status."} action={posts.length === 0 ? <Button size="sm" onClick={() => openNew()}>Create a post</Button> : undefined} />
              ) : (
                <div className="space-y-6">
                  {listGroups.groups.map((g) => (
                    <section key={g.key} className="space-y-2">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider text-white/55", g.tone)}>{g.label} <span className="font-normal text-white/35">· {g.posts.length}</span></h3>
                      <div className="space-y-2">{g.posts.map((p) => postRow(p, g.key === "attention" || g.key === "posted"))}</div>
                      {g.key === "posted" && listGroups.postedTotal > g.posts.length && <Button variant="ghost" size="sm" onClick={() => setShowAllPosted(true)}>Show all {listGroups.postedTotal} posted</Button>}
                    </section>
                  ))}
                </div>
              )
            ) : (
              <AccountsPanel
                clients={clients}
                accounts={accounts}
                clientFilter={clientFilter}
                canDelete={isManager}
                onCreate={async (row) => { const e = await data.createAccount(row); return e ? explainPostitError(e) : null; }}
                onUpdate={async (id, patch) => { const e = await data.updateAccount(id, patch); return e ? explainPostitError(e) : null; }}
                onDelete={async (id) => { const e = await data.deleteAccount(id); return e ? explainPostitError(e) : null; }}
              />
            )}
          </>
        )}
      </div>

      <PostComposer open={!!seed} seed={seed} clients={clients} accounts={accounts} onClose={() => setSeed(null)} onSave={handleSave} />

      <Dialog open={!!markFor} onOpenChange={(o) => !busy && !o && setMarkFor(null)}>
        <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as posted</DialogTitle>
            <DialogDescription>Record that this has gone live. Add the link to the live post if you have it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="mk-url">Link to the live post <span className="text-white/40">(optional)</span></Label>
            <Input id="mk-url" value={markUrl} onChange={(e) => setMarkUrl(e.target.value)} placeholder="https://…" onKeyDown={(e) => { if (e.key === "Enter") confirmMarkPosted(); }} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setMarkFor(null)} disabled={busy}>Cancel</Button>
            <Button onClick={confirmMarkPosted} disabled={busy} className="gap-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Mark as posted</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>It will be removed permanently. This doesn't delete anything already published on the platform.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VirtualOfficeLayout>
  );
};

export default PostScheduler;
