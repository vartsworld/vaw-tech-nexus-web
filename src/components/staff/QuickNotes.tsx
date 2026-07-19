import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, StickyNote, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickNotesProps {
  userId: string;
}

export const QuickNotes = ({ userId }: QuickNotesProps) => {
  const [notes, setNotes] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const { data, error } = await supabase
        .from('staff_notes')
        .insert({
          user_id: userId,
          content: newNote.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote("");
      toast.success("Note added successfully");
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('staff_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
      toast.success("Note deleted");
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error("Failed to delete note");
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-lg border-white/10 text-white h-full relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-yellow-400" />
          Quick Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            id="quick-note-input"
            aria-label="Quick note content"
            placeholder="Add a quick note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            maxLength={500}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-yellow-400"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                }
            }}
          />
          <div className="flex justify-between items-center text-[10px] text-white/40 px-1">
            <span>Press Enter to save, Shift+Enter for new line</span>
            <span className={cn(newNote.length >= 400 ? "text-amber-400 font-bold" : "")}>
              {newNote.length}/500
            </span>
          </div>
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || addingNote || newNote.length > 500}
            size="sm"
            className="w-full"
          >
            {addingNote ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Note
          </Button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {loading ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/50" /></div>
          ) : notes.length === 0 ? (
             <p className="text-center text-white/50 text-sm py-4">No notes yet</p>
          ) : (
            notes.map((note) => (
                <div key={note.id} className="p-3 bg-white/5 rounded-lg border border-white/10 group relative hover:bg-white/10 transition-colors">
                <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete note"
                    title="Delete note"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 transition-opacity text-white/50 hover:text-white bg-black/20 hover:bg-black/40"
                    onClick={() => handleDeleteNote(note.id)}
                >
                    <X className="h-3 w-3" />
                </Button>
                <p className="text-sm text-white/90 pr-6 break-words whitespace-pre-wrap">{note.content}</p>
                <p className="text-[10px] text-white/40 mt-2 text-right">
                    {format(new Date(note.created_at), 'MMM dd, HH:mm')}
                </p>
                </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
