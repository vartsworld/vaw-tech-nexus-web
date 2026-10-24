import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send, Hash, Search, Smile, Plus, ArrowLeft, ChevronDown, MoreVertical, Copy, Trash2,
  AlertCircle, RotateCcw, X, WifiOff, Loader2, Users, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ----------------------------- types & helpers ----------------------------- */

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  channel_id?: string | null;
  recipient_id?: string | null;
  created_at: string;
  status?: "sending" | "failed";
}

interface ChatChannel {
  id: string;
  name: string;
  description?: string | null;
  is_general: boolean;
  department_id?: string | null;
}

interface Person {
  user_id: string;
  full_name: string;
  avatar?: string | null;
  role?: string | null;
}

type Conversation = { type: "channel" | "dm"; id: string };

interface TeamChatProps {
  userId: string;
  userProfile: any;
}

const EMOJIS = [
  "👍", "👏", "🙌", "🎉", "🔥", "💯", "✅", "🙏", "😀", "😂", "😊", "😍", "🤝", "😅", "🤔", "😮",
  "😢", "😎", "🥳", "💪", "👀", "❤️", "⭐", "🚀", "📌", "📎", "📅", "⏰", "☕", "🍕", "🎯", "💡",
];

const MANAGER_ROLES = ["hr", "admin", "super_admin", "team_head", "manager"];
const keyOf = (c: Conversation) => `${c.type === "channel" ? "c" : "d"}:${c.id}`;
const isUuid = (v?: string | null) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Small, safe inline formatter: **bold**, *italic*, `code`, links and @mentions. No raw HTML is ever injected. */
const renderInline = (text: string, mentionNames: string[], highlight?: string) => {
  const escapedNames = mentionNames
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const mentionPart = escapedNames.length ? `|@(?:${escapedNames.join("|")})` : "";
  const re = new RegExp(`(\\*\\*[^*\\n]+\\*\\*|\\*[^*\\n]+\\*|\`[^\`\\n]+\`|https?:\\/\\/[^\\s<]+${mentionPart})`, "gi");
  const wrap = (s: string, k: string) => {
    if (!highlight) return s;
    const i = s.toLowerCase().indexOf(highlight.toLowerCase());
    if (i < 0) return s;
    return (
      <span key={k}>
        {s.slice(0, i)}
        <mark className="rounded bg-yellow-300/80 px-0.5 text-black">{s.slice(i, i + highlight.length)}</mark>
        {s.slice(i + highlight.length)}
      </span>
    );
  };
  return text.split(re).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return <code key={i} className="rounded bg-black/40 px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^https?:\/\//i.test(part)) {
      const clean = part.replace(/[.,!?)]+$/, "");
      const tail = part.slice(clean.length);
      return (
        <span key={i}>
          <a href={clean} target="_blank" rel="noopener noreferrer" className="underline decoration-white/40 underline-offset-2 hover:decoration-white break-all">{clean}</a>
          {tail}
        </span>
      );
    }
    if (part.startsWith("@") && mentionNames.some((n) => n.toLowerCase() === part.slice(1).toLowerCase()))
      return <span key={i} className="rounded bg-sky-400/25 px-1 font-medium text-sky-200">{part}</span>;
    return <span key={i}>{wrap(part, `h${i}`)}</span>;
  });
};

const PersonAvatar = ({ p, size = "h-8 w-8", online }: { p?: Partial<Person>; size?: string; online?: boolean }) => (
  <div className="relative shrink-0">
    <Avatar className={size}>
      <AvatarImage src={p?.avatar || undefined} />
      <AvatarFallback className="bg-slate-700 text-xs font-semibold text-white">{(p?.full_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
    {online !== undefined && (
      <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900", online ? "bg-emerald-400" : "bg-slate-500")} />
    )}
  </div>
);

/* --------------------------------- component -------------------------------- */

const TeamChat = ({ userId, userProfile }: TeamChatProps) => {
  const { toast } = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [wide, setWide] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [connected, setConnected] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [listFilter, setListFilter] = useState("");
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [newBelow, setNewBelow] = useState(0);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: "", description: "" });

  const activeRef = useRef<Conversation | null>(null);
  const nearBottomRef = useRef(true);
  const typingChannelRef = useRef<any>(null);
  const lastTypingSent = useRef(0);
  activeRef.current = active;

  const canCreateChannel = MANAGER_ROLES.includes(userProfile?.role);
  const peopleMap = useMemo(() => Object.fromEntries(people.map((p) => [p.user_id, p])), [people]);
  const me: Person = useMemo(() => ({
    user_id: userId,
    full_name: userProfile?.full_name || "You",
    avatar: userProfile?.profile_photo_url || userProfile?.avatar_url,
  }), [userId, userProfile]);
  const mentionNames = useMemo(() => [me.full_name, ...people.map((p) => p.full_name)], [me, people]);

  /* -------- last-read bookkeeping (per browser) -------- */
  const readKey = `vaw_chat_read_${userId}`;
  const getRead = useCallback((): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem(readKey) || "{}"); } catch { return {}; }
  }, [readKey]);
  const markRead = useCallback((key: string) => {
    const r = getRead();
    r[key] = new Date().toISOString();
    try { localStorage.setItem(readKey, JSON.stringify(r)); } catch { /* storage unavailable */ }
    setUnread((u) => (u[key] ? { ...u, [key]: 0 } : u));
  }, [getRead, readKey]);

  /* -------- layout: adapt to the space the chat is given -------- */
  useEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 640));
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  /* -------- initial data -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: ch }, { data: staff }] = await Promise.all([
        supabase.from("chat_channels").select("*").order("is_general", { ascending: false }).order("name"),
        supabase.from("staff_profiles").select("user_id, full_name, avatar_url, profile_photo_url, role, application_status").neq("user_id", userId).order("full_name"),
      ]);
      if (cancelled) return;
      const deptId = userProfile?.department_id;
      const visible = ((ch as any[]) || []).filter((c) => c.is_general || !c.department_id || c.department_id === deptId || MANAGER_ROLES.includes(userProfile?.role));
      setChannels(visible);
      setPeople(
        ((staff as any[]) || [])
          .filter((s) => s.application_status !== "dismissed" && s.user_id)
          .map((s) => ({ user_id: s.user_id, full_name: s.full_name || "Unknown", avatar: s.profile_photo_url || s.avatar_url, role: s.role })),
      );
      const first = visible.find((c) => c.is_general) || visible[0];
      if (first) setActive({ type: "channel", id: first.id });

      // Unread direct messages since the last time each conversation was opened
      const read = getRead();
      const { data: dms } = await supabase
        .from("chat_messages")
        .select("sender_id, created_at")
        .eq("recipient_id", userId)
        .is("channel_id", null)
        .order("created_at", { ascending: false })
        .limit(300);
      if (cancelled) return;
      const counts: Record<string, number> = {};
      (dms || []).forEach((m: any) => {
        const k = `d:${m.sender_id}`;
        const since = read[k] || read._init;
        if (since && m.created_at > since) counts[k] = (counts[k] || 0) + 1;
      });
      setUnread(counts);
      // First ever visit: treat everything as read from now on
      if (!Object.keys(read).length) { try { localStorage.setItem(readKey, JSON.stringify({ _init: new Date().toISOString() })); } catch { /* ignore */ } }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* -------- load a conversation -------- */
  const PAGE = 60;
  const loadMessages = useCallback(async (conv: Conversation, before?: string) => {
    let q = supabase.from("chat_messages").select("id, content, sender_id, channel_id, recipient_id, created_at");
    if (conv.type === "channel") {
      q = q.eq("channel_id", conv.id);
    } else {
      if (!isUuid(conv.id)) return [];
      q = q
        .is("channel_id", null)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${conv.id}),and(sender_id.eq.${conv.id},recipient_id.eq.${userId})`);
    }
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(PAGE);
    if (error) throw error;
    setHasMore((data || []).length === PAGE);
    return ((data as ChatMessage[]) || []).reverse();
  }, [userId]);

  const openConversation = useCallback(async (conv: Conversation) => {
    setActive(conv);
    setMobileView("chat");
    setSearch("");
    setShowSearch(false);
    setMessages([]);
    setNewBelow(0);
    nearBottomRef.current = true;
    setLoadingMsgs(true);
    try {
      const msgs = await loadMessages(conv);
      if (activeRef.current && keyOf(activeRef.current) === keyOf(conv)) setMessages(msgs);
    } catch (e) {
      console.error("[TeamChat] load failed", e);
      toast({ title: "Couldn't load messages", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setLoadingMsgs(false);
    }
    markRead(keyOf(conv));
  }, [loadMessages, markRead, toast]);

  // Open the default conversation once channels have loaded
  const openedFirst = useRef(false);
  useEffect(() => {
    if (active && !openedFirst.current) {
      openedFirst.current = true;
      openConversation(active);
      setMobileView("list");
    }
  }, [active, openConversation]);

  const loadEarlier = async () => {
    if (!active || !messages.length) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight || 0;
    try {
      const older = await loadMessages(active, messages[0].created_at);
      nearBottomRef.current = false;
      setMessages((m) => [...older, ...m]);
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
    } catch { toast({ title: "Couldn't load earlier messages", variant: "destructive" }); }
  };

  /* -------- realtime: messages, presence -------- */
  useEffect(() => {
    if (!userId) return;
    const subscription = supabase
      .channel(`team-chat-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as ChatMessage;
        const conv: Conversation | null = m.channel_id
          ? { type: "channel", id: m.channel_id }
          : m.recipient_id === userId
            ? { type: "dm", id: m.sender_id }
            : m.sender_id === userId && m.recipient_id
              ? { type: "dm", id: m.recipient_id }
              : null;
        if (!conv) return;
        const cur = activeRef.current;
        if (cur && keyOf(cur) === keyOf(conv)) {
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            // replace the optimistic copy of our own message, if any
            const idx = prev.findIndex((x) => x.status === "sending" && x.sender_id === m.sender_id && x.content === m.content);
            if (idx >= 0) { const next = [...prev]; next[idx] = m; return next; }
            return [...prev, m];
          });
          if (m.sender_id !== userId) {
            if (nearBottomRef.current) markRead(keyOf(conv)); else setNewBelow((n) => n + 1);
            setTyping((t) => { const n = { ...t }; delete n[m.sender_id]; return n; });
          }
        } else if (m.sender_id !== userId) {
          if (m.channel_id && !channelsRef.current.some((c) => c.id === m.channel_id)) return;
          setUnread((u) => ({ ...u, [keyOf(conv)]: (u[keyOf(conv)] || 0) + 1 }));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        const id = (payload.old as any)?.id;
        if (id) setMessages((prev) => prev.filter((x) => x.id !== id));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected((was) => {
            // after a drop, pull anything we missed
            if (!was && activeRef.current) loadMessages(activeRef.current).then(setMessages).catch(() => {});
            return true;
          });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnected(false);
        }
      });

    const presence = supabase.channel("team-chat-presence", { config: { presence: { key: userId } } });
    presence
      .on("presence", { event: "sync" }, () => setOnlineIds(new Set(Object.keys(presence.presenceState()))))
      .subscribe(async (status) => { if (status === "SUBSCRIBED") await presence.track({ user_id: userId, at: Date.now() }); });

    const onOnline = () => setConnected(true);
    const onOffline = () => setConnected(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      supabase.removeChannel(subscription);
      supabase.removeChannel(presence);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const channelsRef = useRef<ChatChannel[]>([]);
  channelsRef.current = channels;

  /* -------- typing indicator over a broadcast channel (no database writes) -------- */
  const typingKey = active ? (active.type === "channel" ? `typing-c-${active.id}` : `typing-d-${[userId, active.id].sort().join("-")}`) : "";
  useEffect(() => {
    if (!typingKey) return;
    setTyping({});
    const ch = supabase.channel(typingKey, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!payload?.user_id || payload.user_id === userId) return;
      setTyping((t) => ({ ...t, [payload.user_id]: Date.now() }));
    }).subscribe();
    typingChannelRef.current = ch;
    const sweep = setInterval(() => {
      setTyping((t) => {
        const now = Date.now();
        const next = Object.fromEntries(Object.entries(t).filter(([, ts]) => now - ts < 4000));
        return Object.keys(next).length === Object.keys(t).length ? t : next;
      });
    }, 1500);
    return () => { clearInterval(sweep); typingChannelRef.current = null; supabase.removeChannel(ch); };
  }, [typingKey, userId]);

  const emitTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000 || !typingChannelRef.current) return;
    lastTypingSent.current = now;
    typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: userId } });
  };

  /* -------- scrolling -------- */
  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setNewBelow(0);
    if (active) markRead(keyOf(active));
  };
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (nearBottomRef.current || last?.sender_id === userId) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottomRef.current && newBelow) { setNewBelow(0); if (active) markRead(keyOf(active)); }
  };

  /* -------- sending & deleting -------- */
  const send = async (text: string, tempId?: string) => {
    if (!active || !text.trim()) return;
    const content = text.trim();
    const id = tempId || `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const base: ChatMessage = {
      id, content, sender_id: userId, created_at: new Date().toISOString(), status: "sending",
      channel_id: active.type === "channel" ? active.id : null,
      recipient_id: active.type === "dm" ? active.id : null,
    };
    nearBottomRef.current = true;
    setMessages((prev) => (tempId ? prev.map((m) => (m.id === tempId ? { ...m, status: "sending" } : m)) : [...prev, base]));
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ content, sender_id: userId, channel_id: base.channel_id, recipient_id: base.recipient_id } as any)
      .select("id, content, sender_id, channel_id, recipient_id, created_at")
      .single();
    if (error || !data) {
      console.error("[TeamChat] send failed", error);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "failed" } : m)));
      return;
    }
    setMessages((prev) => {
      const real = data as ChatMessage;
      const withoutDup = prev.filter((m) => m.id !== real.id || m.id === id);
      return withoutDup.map((m) => (m.id === id ? real : m));
    });
  };

  const submit = () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");
    setMention(null);
    requestAnimationFrame(() => { if (inputRef.current) inputRef.current.style.height = "auto"; });
    send(text);
  };

  const deleteMessage = async (m: ChatMessage) => {
    if (m.status === "failed") { setMessages((p) => p.filter((x) => x.id !== m.id)); return; }
    const prevList = messages;
    setMessages((p) => p.filter((x) => x.id !== m.id));
    const { error } = await supabase.from("chat_messages").delete().eq("id", m.id).eq("sender_id", userId);
    if (error) {
      setMessages(prevList);
      toast({ title: "Couldn't delete message", description: "You may not have permission to delete messages.", variant: "destructive" });
    }
  };

  const onDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDraft(v);
    emitTyping();
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    const caret = el.selectionStart ?? v.length;
    const m = /(^|\s)@([^\s@]*)$/.exec(v.slice(0, caret));
    setMention(m ? { query: m[2].toLowerCase(), start: caret - m[2].length - 1 } : null);
  };

  const insertMention = (p: Person) => {
    if (!mention) return;
    const el = inputRef.current;
    const caret = el?.selectionStart ?? draft.length;
    const next = draft.slice(0, mention.start) + `@${p.full_name} ` + draft.slice(caret);
    setDraft(next);
    setMention(null);
    requestAnimationFrame(() => el?.focus());
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? draft.length;
    setDraft(draft.slice(0, pos) + emoji + draft.slice(pos));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(pos + emoji.length, pos + emoji.length); });
  };

  const createChannel = async () => {
    const name = channelForm.name.trim().toLowerCase().replace(/\s+/g, "-");
    if (name.length < 2) { toast({ title: "Give the channel a name", variant: "destructive" }); return; }
    const { data, error } = await supabase
      .from("chat_channels")
      .insert({ name, description: channelForm.description.trim() || null, is_general: false, created_by: userId } as any)
      .select("*")
      .single();
    if (error || !data) {
      toast({ title: "Couldn't create channel", description: error?.message, variant: "destructive" });
      return;
    }
    setChannels((c) => [...c, data as any]);
    setShowNewChannel(false);
    setChannelForm({ name: "", description: "" });
    openConversation({ type: "channel", id: (data as any).id });
  };

  /* -------- derived -------- */
  const activeChannel = active?.type === "channel" ? channels.find((c) => c.id === active.id) : null;
  const activePerson = active?.type === "dm" ? peopleMap[active.id] : null;
  const title = activeChannel ? `# ${activeChannel.name}` : activePerson?.full_name || "Select a conversation";
  const typers = Object.keys(typing).map((id) => peopleMap[id]?.full_name?.split(" ")[0]).filter(Boolean) as string[];
  const typingText = typers.length === 1 ? `${typers[0]} is typing…` : typers.length === 2 ? `${typers[0]} and ${typers[1]} are typing…` : typers.length > 2 ? "Several people are typing…" : "";
  const mentionOptions = mention ? people.filter((p) => p.full_name.toLowerCase().includes(mention.query)).slice(0, 5) : [];
  const shown = search.trim() ? messages.filter((m) => m.content.toLowerCase().includes(search.trim().toLowerCase())) : messages;
  const filteredPeople = people
    .filter((p) => p.full_name.toLowerCase().includes(listFilter.toLowerCase()))
    .sort((a, b) => Number(onlineIds.has(b.user_id)) - Number(onlineIds.has(a.user_id)) || a.full_name.localeCompare(b.full_name));
  const filteredChannels = channels.filter((c) => c.name.toLowerCase().includes(listFilter.toLowerCase()));

  const showList = wide || mobileView === "list";
  const showChat = wide || mobileView === "chat";

  /* ---------------------------------- render ---------------------------------- */
  const sidebar = (
    <aside className={cn("flex min-h-0 flex-col border-white/10 bg-black/20", wide ? "w-64 shrink-0 border-r" : "w-full flex-1")}>
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white"><MessageCircle className="h-4 w-4 text-sky-400" />Chat</h2>
        {canCreateChannel && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setShowNewChannel(true)} title="New channel">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
          <Input value={listFilter} onChange={(e) => setListFilter(e.target.value)} placeholder="Find channel or person" className="h-8 border-white/10 bg-white/5 pl-8 text-xs text-white placeholder:text-white/40" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Channels</p>
        {filteredChannels.map((c) => {
          const k = `c:${c.id}`;
          const isActive = active && keyOf(active) === k;
          return (
            <button key={c.id} onClick={() => openConversation({ type: "channel", id: c.id })}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors", isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
              {c.is_general ? <Hash className="h-4 w-4 shrink-0 text-white/50" /> : <Users className="h-4 w-4 shrink-0 text-white/50" />}
              <span className={cn("flex-1 truncate", unread[k] ? "font-semibold text-white" : "")}>{c.name}</span>
              {!!unread[k] && <span className="rounded-full bg-sky-500 px-1.5 text-[10px] font-semibold text-white">{unread[k] > 99 ? "99+" : unread[k]}</span>}
            </button>
          );
        })}
        <p className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">Direct messages · {onlineIds.size > 0 ? `${[...onlineIds].filter((i) => i !== userId).length} online` : "none online"}</p>
        {filteredPeople.map((p) => {
          const k = `d:${p.user_id}`;
          const isActive = active && keyOf(active) === k;
          return (
            <button key={p.user_id} onClick={() => openConversation({ type: "dm", id: p.user_id })}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors", isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
              <PersonAvatar p={p} size="h-6 w-6" online={onlineIds.has(p.user_id)} />
              <span className={cn("flex-1 truncate", unread[k] ? "font-semibold text-white" : "")}>{p.full_name}</span>
              {!!unread[k] && <span className="rounded-full bg-sky-500 px-1.5 text-[10px] font-semibold text-white">{unread[k] > 99 ? "99+" : unread[k]}</span>}
            </button>
          );
        })}
        {!filteredPeople.length && !filteredChannels.length && <p className="px-2 py-6 text-center text-xs text-white/40">Nothing matches “{listFilter}”.</p>}
      </div>
    </aside>
  );

  let lastDay = "";
  const conversation = (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        {!wide && (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white/80 hover:bg-white/10 hover:text-white" onClick={() => setMobileView("list")} aria-label="Back to conversations">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {activePerson && <PersonAvatar p={activePerson} online={onlineIds.has(activePerson.user_id)} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <p className="truncate text-xs text-white/50">
            {activeChannel ? (activeChannel.description || (activeChannel.is_general ? "Everyone in the company" : "Channel")) : activePerson ? (onlineIds.has(activePerson.user_id) ? "Online now" : activePerson.role?.replace(/_/g, " ") || "Offline") : ""}
          </p>
        </div>
        {showSearch ? (
          <div className="flex items-center gap-1">
            <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages" className="h-8 w-36 border-white/10 bg-white/5 text-xs text-white placeholder:text-white/40 sm:w-48" />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:bg-white/10" onClick={() => { setShowSearch(false); setSearch(""); }}><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setShowSearch(true)} title="Search this conversation"><Search className="h-4 w-4" /></Button>
        )}
      </header>

      {!connected && (
        <div className="flex items-center gap-2 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200"><WifiOff className="h-3.5 w-3.5" />Reconnecting… new messages will appear when you're back online.</div>
      )}

      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto px-3 py-3">
          {hasMore && !search && (
            <div className="pb-3 text-center">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-white/60 hover:bg-white/10 hover:text-white" onClick={loadEarlier}>Load earlier messages</Button>
            </div>
          )}
          {loadingMsgs && <div className="flex justify-center py-10 text-white/50"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {!loadingMsgs && !shown.length && (
            <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center text-white/50">
              <MessageCircle className="mb-2 h-8 w-8 text-white/20" />
              <p className="text-sm">{search ? "No messages match your search." : active?.type === "dm" ? `Start the conversation with ${activePerson?.full_name || "your colleague"}.` : "No messages yet. Say hello!"}</p>
            </div>
          )}
          {shown.map((m, i) => {
            const own = m.sender_id === userId;
            const sender = own ? me : peopleMap[m.sender_id];
            const prev = shown[i - 1];
            const day = dayLabel(m.created_at);
            const newDay = day !== lastDay;
            lastDay = day;
            const grouped = !newDay && prev && prev.sender_id === m.sender_id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
            const mentionsMe = !own && mentionNames[0] && m.content.toLowerCase().includes(`@${me.full_name.toLowerCase()}`);
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="my-3 flex items-center gap-3 text-[11px] text-white/40"><span className="h-px flex-1 bg-white/10" />{day}<span className="h-px flex-1 bg-white/10" /></div>
                )}
                <div className={cn("group flex items-end gap-2", own ? "flex-row-reverse" : "", grouped ? "mt-0.5" : "mt-3")}>
                  <div className="w-7 shrink-0">{!own && !grouped && <PersonAvatar p={sender} size="h-7 w-7" />}</div>
                  <div className={cn("flex max-w-[78%] flex-col", own ? "items-end" : "items-start")}>
                    {!own && !grouped && active?.type === "channel" && <span className="mb-0.5 px-1 text-[11px] font-medium text-white/60">{sender?.full_name || "Former member"}</span>}
                    <div className="flex items-center gap-1">
                      {own && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded p-1 text-white/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100" aria-label="Message actions"><MoreVertical className="h-3.5 w-3.5" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dark border-white/10 bg-slate-900 text-white">
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(m.content); toast({ title: "Copied" }); }}><Copy className="mr-2 h-3.5 w-3.5" />Copy text</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-300 focus:text-red-200" onClick={() => deleteMessage(m)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div className={cn("whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        own ? "rounded-br-md bg-sky-600 text-white" : "rounded-bl-md border border-white/10 bg-white/10 text-white",
                        mentionsMe && "ring-1 ring-sky-300/60", m.status === "sending" && "opacity-60", m.status === "failed" && "ring-1 ring-red-400/70")}>
                        {renderInline(m.content, mentionNames, search.trim() || undefined)}
                      </div>
                      {!own && (
                        <button className="rounded p-1 text-white/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100" aria-label="Copy message" onClick={() => { navigator.clipboard.writeText(m.content); toast({ title: "Copied" }); }}><Copy className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                    {m.status === "failed" ? (
                      <span className="mt-0.5 flex items-center gap-2 px-1 text-[11px] text-red-300">
                        <AlertCircle className="h-3 w-3" />Not sent
                        <button className="flex items-center gap-1 underline" onClick={() => send(m.content, m.id)}><RotateCcw className="h-3 w-3" />Retry</button>
                        <button className="underline" onClick={() => deleteMessage(m)}>Discard</button>
                      </span>
                    ) : (!grouped || m.status === "sending") && (
                      <span className="mt-0.5 px-1 text-[10px] text-white/40">{m.status === "sending" ? "Sending…" : timeLabel(m.created_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {newBelow > 0 && (
          <button onClick={() => scrollToBottom(true)} className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            <ChevronDown className="h-3.5 w-3.5" />{newBelow} new message{newBelow > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="h-5 px-4 text-xs text-white/50" aria-live="polite">{typingText}</div>

      <div className="relative border-t border-white/10 p-3">
        {mention && mentionOptions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl">
            {mentionOptions.map((p) => (
              <button key={p.user_id} onMouseDown={(e) => { e.preventDefault(); insertMention(p); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10">
                <PersonAvatar p={p} size="h-6 w-6" online={onlineIds.has(p.user_id)} />{p.full_name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 pr-14">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Insert emoji"><Smile className="h-5 w-5" /></Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="dark grid w-64 grid-cols-8 gap-1 border-white/10 bg-slate-900 p-2">
              {EMOJIS.map((e) => <button key={e} onClick={() => insertEmoji(e)} className="rounded p-1 text-lg hover:bg-white/10">{e}</button>)}
            </PopoverContent>
          </Popover>
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={onDraftChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
              if (e.key === "Escape") setMention(null);
            }}
            rows={1}
            disabled={!active}
            placeholder={active ? `Message ${activeChannel ? "#" + activeChannel.name : activePerson?.full_name || ""}` : "Select a conversation"}
            className="min-h-9 max-h-[120px] resize-none border-white/10 bg-white/10 py-2 text-sm text-white placeholder:text-white/40"
          />
          <Button onClick={submit} disabled={!draft.trim() || !active} size="icon" className="h-9 w-9 shrink-0 bg-sky-600 text-white hover:bg-sky-500" aria-label="Send message"><Send className="h-4 w-4" /></Button>
        </div>
        <p className="mt-1.5 hidden px-1 text-[10px] text-white/30 sm:block">Enter to send · Shift+Enter for a new line · @ to mention · **bold** *italic* `code`</p>
      </div>
    </section>
  );

  return (
    <div ref={rootRef} className="flex h-full max-h-full min-h-[360px] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-sm">
      {showList && sidebar}
      {showChat && conversation}

      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent className="dark border-white/10 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New channel</DialogTitle>
            <DialogDescription className="text-white/60">Channels are shared spaces everyone on the team can see and join.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={channelForm.name} onChange={(e) => setChannelForm((f) => ({ ...f, name: e.target.value }))} placeholder="channel-name" className="border-white/10 bg-white/5 text-white" />
            <Input value={channelForm.description} onChange={(e) => setChannelForm((f) => ({ ...f, description: e.target.value }))} placeholder="What is it for? (optional)" className="border-white/10 bg-white/5 text-white" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewChannel(false)} className="text-white/70 hover:bg-white/10">Cancel</Button>
            <Button onClick={createChannel} className="bg-sky-600 hover:bg-sky-500">Create channel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamChat;
