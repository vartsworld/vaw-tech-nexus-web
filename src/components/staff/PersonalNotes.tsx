import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday, differenceInCalendarDays } from "date-fns";
import {
  Check,
  ClipboardPaste,
  Copy,
  Loader2,
  NotebookPen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const NOTE_LIMIT = 2000;

type Note = { id: string; content: string; created_at: string; updated_at?: string | null };

/** Quick Notepad (sidebar) saves to the same table; it fires this so the page refreshes. */
export const NOTES_CHANGED_EVENT = "vaw:notes-changed";
export const OPEN_QUICK_NOTEPAD_EVENT = "vaw:open-quick-notepad";

const pinKey = (userId: string) => `vaw_pinned_notes_${userId}`;

const readPins = (userId: string): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(pinKey(userId)) || "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const groupLabel = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (differenceInCalendarDays(new Date(), d) < 7) return "This week";
  return format(d, "MMMM yyyy");
};

const wasEdited = (n: Note) =>
  !!n.updated_at && new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 2000;

interface PersonalNotesProps {
  userId: string;
  /** Hide the page title (used inside cards on the mobile home) */
  compact?: boolean;
}

export const PersonalNotes = ({ userId, compact = false }: PersonalNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("staff_notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes((data || []) as Note[]);
      setLoadError(false);
    } catch (e) {
      console.error("Error fetching notes:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setPins(readPins(userId));
    load();
    window.addEventListener(NOTES_CHANGED_EVENT, load);
    return () => window.removeEventListener(NOTES_CHANGED_EVENT, load);
  }, [userId, load]);

  const savePins = (next: string[]) => {
    setPins(next);
    try { localStorage.setItem(pinKey(userId), JSON.stringify(next)); } catch { /* storage full or blocked */ }
  };

  const addNote = async () => {
    const content = draft.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("staff_notes").insert({ user_id: userId, content }).select().single();
      if (error) throw error;
      setNotes((prev) => [data as Note, ...prev]);
      setDraft("");
      toast.success("Note saved");
    } catch (e) {
      console.error("Error adding note:", e);
      toast.error("Couldn't save the note. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (note: Note) => {
    const content = editText.trim();
    if (!content) return;
    if (content === note.content) { setEditingId(null); return; }
    setBusyId(note.id);
    try {
      const updated_at = new Date().toISOString();
      const { error } = await supabase.from("staff_notes").update({ content, updated_at }).eq("id", note.id);
      if (error) throw error;
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, content, updated_at } : n)));
      setEditingId(null);
    } catch (e) {
      console.error("Error updating note:", e);
      toast.error("Couldn't update the note.");
    } finally {
      setBusyId(null);
    }
  };

  const removeNote = async (id: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from("staff_notes").delete().eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (pins.includes(id)) savePins(pins.filter((p) => p !== id));
      toast.success("Note deleted");
    } catch (e) {
      console.error("Error deleting note:", e);
      toast.error("Couldn't delete the note.");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const copyNote = async (n: Note) => {
    try {
      await navigator.clipboard.writeText(n.content);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it by hand.");
    }
  };

  const togglePin = (id: string) => savePins(pins.includes(id) ? pins.filter((p) => p !== id) : [id, ...pins]);

  const { pinned, groups, shown } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? notes.filter((n) => n.content.toLowerCase().includes(q)) : notes;
    const pinnedList = list.filter((n) => pins.includes(n.id));
    const rest = list.filter((n) => !pins.includes(n.id));
    const map = new Map<string, Note[]>();
    rest.forEach((n) => {
      const k = groupLabel(n.created_at);
      map.set(k, [...(map.get(k) || []), n]);
    });
    return { pinned: pinnedList, groups: Array.from(map.entries()), shown: list.length };
  }, [notes, pins, query]);

  const renderNote = (n: Note) => {
    const editing = editingId === n.id;
    const busy = busyId === n.id;
    return (
      <li
        key={n.id}
        className={cn(
          "group flex flex-col rounded-xl border bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]",
          pins.includes(n.id) ? "border-amber-400/30" : "border-white/10"
        )}
      >
        {editing ? (
          <div className="space-y-2">
            <Textarea
              autoFocus
              aria-label="Edit note"
              value={editText}
              maxLength={NOTE_LIMIT}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); saveEdit(n); }
                if (e.key === "Escape") setEditingId(null);
              }}
              rows={5}
              className="resize-y border-white/10 bg-black/30 text-sm text-white focus-visible:ring-1 focus-visible:ring-amber-400"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/40">Ctrl+Enter to save, Esc to cancel</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" className="h-8 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 bg-amber-500 text-black hover:bg-amber-400" disabled={busy || !editText.trim()} onClick={() => saveEdit(n)}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/90">{n.content}</p>
        )}

        {!editing && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
            <span className="text-[11px] text-white/40">
              {format(new Date(n.created_at), "d MMM, h:mm a")}
              {wasEdited(n) && " · edited"}
            </span>
            {confirmId === n.id ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-red-300">Delete this note?</span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-white/70 hover:bg-white/10" onClick={() => setConfirmId(null)}>
                  No
                </Button>
                <Button size="sm" className="h-7 bg-red-600 px-2 text-xs text-white hover:bg-red-500" disabled={busy} onClick={() => removeNote(n.id)}>
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <IconBtn label={pins.includes(n.id) ? "Unpin note" : "Pin note"} onClick={() => togglePin(n.id)} active={pins.includes(n.id)}>
                  {pins.includes(n.id) ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </IconBtn>
                <IconBtn label="Copy note" onClick={() => copyNote(n)}><Copy className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn label="Edit note" onClick={() => { setEditingId(n.id); setEditText(n.content); setConfirmId(null); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Delete note" onClick={() => setConfirmId(n.id)} danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
              </div>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
              <NotebookPen className="h-6 w-6 text-amber-400" />
              Personal Notes
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Only you can see these. {notes.length > 0 && `${notes.length} ${notes.length === 1 ? "note" : "notes"} saved.`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={() => window.dispatchEvent(new Event(OPEN_QUICK_NOTEPAD_EVENT))}
          >
            <ClipboardPaste className="h-4 w-4 text-amber-300" />
            Quick notepad
          </Button>
        </div>
      )}

      {/* Composer */}
      <section className="rounded-xl border border-white/10 bg-black/30 p-3 backdrop-blur-md sm:p-4">
        <label htmlFor="personal-note-input" className="sr-only">New note</label>
        <Textarea
          id="personal-note-input"
          ref={draftRef}
          value={draft}
          maxLength={NOTE_LIMIT}
          rows={3}
          placeholder="Write a note. Ctrl+Enter to save."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); addNote(); }
          }}
          className="resize-y border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-amber-400"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={cn("text-[11px] tabular-nums", draft.length > NOTE_LIMIT * 0.9 ? "font-semibold text-amber-300" : "text-white/40")}>
            {draft.length}/{NOTE_LIMIT}
          </span>
          <Button size="sm" className="h-9 bg-amber-500 px-4 font-semibold text-black hover:bg-amber-400" onClick={addNote} disabled={!draft.trim() || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Save note
          </Button>
        </div>
      </section>

      {/* Search */}
      {notes.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes"
            aria-label="Search notes"
            className="h-10 border-white/10 bg-white/5 pl-9 pr-9 text-sm text-white placeholder:text-white/40"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />)}
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
          <p className="text-sm text-red-200">Couldn't load your notes.</p>
          <Button size="sm" variant="outline" className="mt-3 border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => { setLoading(true); load(); }}>
            Try again
          </Button>
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
          <NotebookPen className="mx-auto h-8 w-8 text-white/25" />
          <p className="mt-3 text-sm font-medium text-white/80">No notes yet</p>
          <p className="mt-1 text-xs text-white/40">Write one above, or use the Quick Notepad button next to Personal Notes in the sidebar.</p>
        </div>
      ) : shown === 0 ? (
        <p className="py-10 text-center text-sm text-white/50">No notes match “{query}”.</p>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <section aria-label="Pinned notes">
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
                <Pin className="h-3 w-3" /> Pinned
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">{pinned.map(renderNote)}</ul>
            </section>
          )}
          {groups.map(([label, items]) => (
            <section key={label} aria-label={label}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">{label}</h2>
              <ul className="grid gap-3 md:grid-cols-2">{items.map(renderNote)}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const IconBtn = ({
  label, onClick, children, active, danger,
}: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean; danger?: boolean }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      "rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40",
      active && "text-amber-300",
      danger && "hover:bg-red-500/15 hover:text-red-300"
    )}
  >
    {children}
  </button>
);

export default PersonalNotes;
