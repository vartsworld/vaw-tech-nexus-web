import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ClipboardPaste,
  Copy,
  Loader2,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

const wasEdited = (n: Note) =>
  !!n.updated_at && new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 2000;

/** Solid pastel card colours (dark text on every one of them), picked per note from its id. */
const CARD_COLOURS = ["#FFC46B", "#FF9F8A", "#D4E86C", "#C4A8F4", "#8FDDEB", "#FFE27D"];
const colourFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_COLOURS[h % CARD_COLOURS.length];
};

interface PersonalNotesProps {
  userId: string;
  /** Smaller title (used inside cards on the mobile home) */
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLElement>(null);
  /** Whatever was half-typed before the user started editing a note; restored on cancel. */
  const stashRef = useRef("");

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

  const focusComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => draftRef.current?.focus(), 150);
  };

  const startEdit = (note: Note) => {
    if (editingId === null) stashRef.current = draft;
    setEditingId(note.id);
    setDraft(note.content);
    setConfirmId(null);
    focusComposer();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(stashRef.current);
    stashRef.current = "";
  };

  const startNew = () => {
    if (editingId) cancelEdit();
    focusComposer();
  };

  const submit = async () => {
    const content = draft.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      if (editingId) {
        const original = notes.find((n) => n.id === editingId);
        if (original && original.content === content) {
          cancelEdit();
          return;
        }
        const updated_at = new Date().toISOString();
        const { error } = await supabase.from("staff_notes").update({ content, updated_at }).eq("id", editingId);
        if (error) throw error;
        setNotes((prev) => prev.map((n) => (n.id === editingId ? { ...n, content, updated_at } : n)));
        toast.success("Note updated");
        setEditingId(null);
        setDraft(stashRef.current);
        stashRef.current = "";
      } else {
        const { data, error } = await supabase.from("staff_notes").insert({ user_id: userId, content }).select().single();
        if (error) throw error;
        setNotes((prev) => [data as Note, ...prev]);
        setDraft("");
        toast.success("Note saved");
      }
    } catch (e) {
      console.error("Error saving note:", e);
      toast.error(editingId ? "Couldn't update the note." : "Couldn't save the note. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async (id: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from("staff_notes").delete().eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (pins.includes(id)) savePins(pins.filter((p) => p !== id));
      if (editingId === id) cancelEdit();
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

  /** Pinned notes first, then newest first. */
  const ordered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? notes.filter((n) => n.content.toLowerCase().includes(q)) : notes;
    return [...list.filter((n) => pins.includes(n.id)), ...list.filter((n) => !pins.includes(n.id))];
  }, [notes, pins, query]);
  const shown = ordered.length;

  const renderNote = (n: Note) => {
    const busy = busyId === n.id;
    const isPinned = pins.includes(n.id);
    const isEditing = editingId === n.id;
    return (
      <li
        key={n.id}
        style={{ backgroundColor: colourFor(n.id) }}
        className={cn(
          "mb-4 flex break-inside-avoid flex-col rounded-[28px] p-5 text-zinc-900 shadow-sm transition-shadow",
          isEditing && "ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f6f4ee]"
        )}
      >
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] font-medium leading-snug text-zinc-900">{n.content}</p>
          <button
            type="button"
            aria-label={isPinned ? "Unpin note" : "Pin note"}
            aria-pressed={isPinned}
            title={isPinned ? "Unpin" : "Pin to top"}
            onClick={() => togglePin(n.id)}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <Star className={cn("h-5 w-5", isPinned ? "fill-yellow-400 text-yellow-500 drop-shadow-[0_0_0.5px_rgba(0,0,0,0.6)]" : "text-zinc-900/60")} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-900/70">
            {format(new Date(n.created_at), "d MMM yyyy")}
            {wasEdited(n) && " · edited"}
          </span>
          {confirmId === n.id ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold">Delete?</span>
              <button type="button" onClick={() => setConfirmId(null)} className="rounded-full px-3 py-1 text-xs font-semibold hover:bg-black/10">No</button>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeNote(n.id)}
                className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <CardBtn label="Copy note" onClick={() => copyNote(n)}><Copy className="h-4 w-4" /></CardBtn>
              <CardBtn label="Delete note" onClick={() => setConfirmId(n.id)}><Trash2 className="h-4 w-4" /></CardBtn>
              <button
                type="button"
                aria-label="Edit note"
                title="Edit"
                onClick={() => startEdit(n)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </li>
    );
  };

  const grid = "columns-1 gap-4 sm:columns-2 xl:columns-3";

  return (
    <div className="space-y-6 rounded-[32px] bg-[#f6f4ee] p-5 text-zinc-900 shadow-xl sm:p-8">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <h1 className={cn("font-bold tracking-tight text-zinc-900", compact ? "text-3xl" : "text-4xl sm:text-5xl")}>Notes</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open quick notepad"
            title="Quick notepad"
            onClick={() => window.dispatchEvent(new Event(OPEN_QUICK_NOTEPAD_EVENT))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <ClipboardPaste className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Write a new note"
            title="New note"
            onClick={startNew}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="h-12 w-full rounded-full border border-transparent bg-white pl-11 pr-11 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none"
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Notepad input: new notes and edits both happen here */}
      <section
        ref={composerRef}
        aria-label={editingId ? "Editing note" : "New note"}
        className={cn("rounded-3xl bg-white p-4 shadow-sm sm:p-5", editingId && "ring-2 ring-zinc-900")}
      >
        {editingId && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
              <Pencil className="h-3 w-3" /> Editing note
            </span>
            <button type="button" onClick={cancelEdit} className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
              Cancel
            </button>
          </div>
        )}
        <label htmlFor="personal-note-input" className="sr-only">{editingId ? "Edit note" : "New note"}</label>
        <textarea
          id="personal-note-input"
          ref={draftRef}
          value={draft}
          maxLength={NOTE_LIMIT}
          rows={4}
          placeholder="Write a note. Ctrl+Enter to save."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); submit(); }
            if (e.key === "Escape" && editingId) cancelEdit();
          }}
          className="w-full resize-y rounded-2xl border-0 bg-transparent text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={cn("text-xs tabular-nums", draft.length > NOTE_LIMIT * 0.9 ? "font-semibold text-red-600" : "text-zinc-500")}>
            {draft.length}/{NOTE_LIMIT}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || saving}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Update note" : "Save note"}
          </button>
        </div>
      </section>

      {/* List */}
      {loading ? (
        <div className={grid}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="mb-4 h-36 animate-pulse break-inside-avoid rounded-[28px] bg-zinc-200" />)}
        </div>
      ) : loadError ? (
        <div className="rounded-3xl bg-white p-6 text-center">
          <p className="text-sm font-medium text-red-700">Couldn't load your notes.</p>
          <button type="button" onClick={() => { setLoading(true); load(); }} className="mt-3 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
            Try again
          </button>
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-zinc-300 px-6 py-12 text-center">
          <NotebookPen className="mx-auto h-9 w-9 text-zinc-400" />
          <p className="mt-3 text-sm font-semibold text-zinc-800">No notes yet</p>
          <p className="mt-1 text-xs text-zinc-500">Write one above. Only you can see your notes.</p>
        </div>
      ) : shown === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-600">No notes match “{query}”.</p>
      ) : (
        <ul className={grid} aria-label="Notes">
          {ordered.map(renderNote)}
        </ul>
      )}
    </div>
  );
};

const CardBtn = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-900/70 transition-colors hover:bg-black/10 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
  >
    {children}
  </button>
);

export default PersonalNotes;
