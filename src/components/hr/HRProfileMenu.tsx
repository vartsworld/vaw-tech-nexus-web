import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins, Eraser, Fingerprint, Flame, Gamepad2, LogOut, Pencil, Smile, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { BiometricSettingsDialog } from "@/components/staff/BiometricSettingsDialog";
import StreakCalendarDialog from "@/components/staff/StreakCalendarDialog";
import { cn } from "@/lib/utils";

const db = supabase as any;

const EMOJIS = [
  "😀", "😂", "🥰", "😍", "🤔", "😎", "🥳", "🤗", "😇", "🙃", "😴", "🤤", "😋", "🧐", "🤓", "😏", "🥺", "😢", "😭", "😤",
  "🤯", "🥴", "🤠", "🥶", "🥵", "😱", "🤫", "🤭", "🙄", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁",
  "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "🍎",
  "🍌", "🍊", "🍋", "🍉", "🍇", "🍓", "🥝", "🍒", "🥥", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🎵",
  "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎻", "🥁", "📱", "💻", "⌨️", "🖥️", "📷", "📺", "🕹️", "💡", "🔔", "🔕",
];

interface Props {
  profile: any;
  onNavigate: (room: string) => void;
}

/** Profile button for the HR top bar: details, emoji passcode, biometrics, streak and sign out in one place. */
const HRProfileMenu = ({ profile, onNavigate }: Props) => {
  const navigate = useNavigate();
  const [me, setMe] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [form, setForm] = useState({ full_name: "", about_me: "" });
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState<"old" | "new" | "confirm">("old");
  const [oldPw, setOldPw] = useState<string[]>([]);
  const [newPw, setNewPw] = useState<string[]>([]);
  const [confirmPw, setConfirmPw] = useState<string[]>([]);

  const userId = profile?.user_id;

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await db.from("staff_profiles")
      .select("full_name, email, role, about_me, emoji_password, attendance_streak, total_points, coins, profile_photo_url, avatar_url")
      .eq("user_id", userId).maybeSingle();
    if (data) { setMe(data); setForm({ full_name: data.full_name || "", about_me: data.about_me || "" }); }
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const name = me?.full_name || profile?.full_name || "HR";
  const photo = me?.profile_photo_url || me?.avatar_url || profile?.profile_photo_url || profile?.avatar_url;
  const streak = me?.attendance_streak ?? profile?.attendance_streak ?? 0;
  const points = me?.total_points ?? profile?.total_points ?? 0;

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/staff/login");
  };

  const saveDetails = async () => {
    if (form.full_name.trim().length < 2) { toast.error("Enter your full name"); return; }
    setSaving(true);
    const { error } = await db.from("staff_profiles").update({ full_name: form.full_name.trim(), about_me: form.about_me.trim() || null }).eq("user_id", userId);
    setSaving(false);
    if (error) { toast.error("Couldn't save your details"); return; }
    toast.success("Details updated");
    setShowEdit(false);
    load();
  };

  const resetEmoji = () => { setStep(me?.emoji_password ? "old" : "new"); setOldPw([]); setNewPw([]); setConfirmPw([]); };
  const current = step === "old" ? oldPw : step === "new" ? newPw : confirmPw;
  const setCurrent = step === "old" ? setOldPw : step === "new" ? setNewPw : setConfirmPw;
  const tap = (e: string) => {
    if (step === "confirm" ? current.length < newPw.length : current.length < 8) setCurrent([...current, e]);
  };

  const saveEmoji = async () => {
    if (newPw.join("") !== confirmPw.join("")) { toast.error("The two patterns don't match"); setConfirmPw([]); return; }
    setSaving(true);
    try {
      const value = newPw.join("");
      const { error } = await db.from("staff_profiles").update({ emoji_password: value, is_emoji_password: true }).eq("user_id", userId);
      if (error) throw error;
      const { error: authError } = await supabase.auth.updateUser({ password: value });
      if (authError) throw authError;
      toast.success("Emoji passcode updated");
      setShowEmoji(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the passcode");
    } finally { setSaving(false); }
  };

  const stepTitle = step === "old" ? "Enter your current passcode" : step === "new" ? "Choose a new passcode (4 to 8 emojis)" : "Enter the new passcode again";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-1 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:pr-3" aria-label="Open profile menu">
            <Avatar className="h-8 w-8">
              <AvatarImage src={photo} />
              <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-foreground sm:block">{name.split(" ")[0]}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="dark w-72 border-white/10 bg-slate-900 p-0 text-white">
          <div className="flex items-center gap-3 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={photo} />
              <AvatarFallback className="bg-primary/20 font-semibold text-primary">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-white/55">{me?.email || ""}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">{(me?.role || profile?.role || "hr").replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pb-3">
            <button onClick={() => setShowStreak(true)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-left hover:bg-white/10">
              <Flame className="h-4 w-4 text-orange-400" />
              <span><span className="block text-sm font-semibold leading-none">{streak} days</span><span className="text-[10px] text-white/50">Streak</span></span>
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5">
              <Coins className="h-4 w-4 text-amber-400" />
              <span><span className="block text-sm font-semibold leading-none">{Number(points).toLocaleString()}</span><span className="text-[10px] text-white/50">Points</span></span>
            </div>
          </div>
          <DropdownMenuSeparator className="m-0 bg-white/10" />
          <div className="p-1.5">
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">Account</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setShowEdit(true)} className="gap-2.5 py-2"><Pencil className="h-4 w-4" />Edit my details</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { resetEmoji(); setShowEmoji(true); }} className="gap-2.5 py-2"><Smile className="h-4 w-4" />Emoji passcode</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowBio(true)} className="gap-2.5 py-2"><Fingerprint className="h-4 w-4" />Fingerprint login</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onNavigate("arcade")} className="gap-2.5 py-2"><Gamepad2 className="h-4 w-4" />Arcade</DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="m-0 bg-white/10" />
          <div className="p-1.5">
            <DropdownMenuItem onSelect={signOut} className="gap-2.5 py-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit details */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="dark border-white/10 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit my details</DialogTitle>
            <DialogDescription className="text-white/60">Your name and bio are shown to the team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="hr-name">Full name</Label><Input id="hr-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border-white/10 bg-white/5" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={me?.email || ""} disabled className="border-white/10 bg-white/5 opacity-60" /></div>
            <div className="space-y-1.5"><Label htmlFor="hr-about">About me</Label><Textarea id="hr-about" rows={3} value={form.about_me} onChange={(e) => setForm({ ...form, about_me: e.target.value })} placeholder="A line or two about you" className="border-white/10 bg-white/5" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)} className="text-white/70 hover:bg-white/10">Cancel</Button>
            <Button onClick={saveDetails} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji passcode */}
      <Dialog open={showEmoji} onOpenChange={(o) => { setShowEmoji(o); if (!o) resetEmoji(); }}>
        <DialogContent className="dark max-h-[90dvh] overflow-y-auto border-white/10 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emoji passcode</DialogTitle>
            <DialogDescription className="text-white/60">{stepTitle}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <div className="flex min-h-[56px] flex-1 flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-3 text-2xl" aria-live="polite">
              {current.length ? current.map((e, i) => <span key={i}>{e}</span>) : <span className="text-xs text-white/30">Tap emojis below</span>}
            </div>
            <Button variant="outline" size="icon" className="h-auto w-12 border-white/10 bg-white/5" onClick={() => setCurrent(current.slice(0, -1))} disabled={!current.length} aria-label="Remove last emoji"><Eraser className="h-4 w-4" /></Button>
          </div>
          <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
            {EMOJIS.map((e, i) => <button key={i} onClick={() => tap(e)} className="rounded-lg p-1.5 text-xl hover:bg-white/10 active:scale-90">{e}</button>)}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {step !== (me?.emoji_password ? "old" : "new") && (
              <Button variant="ghost" className="text-white/70 hover:bg-white/10" onClick={() => { if (step === "confirm") { setStep("new"); setConfirmPw([]); } else { setStep("old"); setNewPw([]); } }}>Back</Button>
            )}
            {step === "old" && (
              <Button disabled={!oldPw.length} onClick={() => {
                if (oldPw.join("") !== (me?.emoji_password || "")) { toast.error("That isn't your current passcode"); setOldPw([]); return; }
                setStep("new");
              }}>Verify</Button>
            )}
            {step === "new" && <Button disabled={newPw.length < 4} onClick={() => setStep("confirm")}>Next</Button>}
            {step === "confirm" && <Button disabled={saving || confirmPw.length !== newPw.length} onClick={saveEmoji}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save passcode</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BiometricSettingsDialog open={showBio} onOpenChange={setShowBio} />
      <StreakCalendarDialog isOpen={showStreak} onOpenChange={setShowStreak} userId={userId || ""} />
    </>
  );
};

export default HRProfileMenu;
