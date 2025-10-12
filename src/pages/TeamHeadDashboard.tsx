import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Coffee, 
  Users, 
  Briefcase, 
  Music, 
  Wallet, 
  Gamepad2, 
  StickyNote, 
  MessageCircle,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Settings,
  User,
  Lock,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import BreakRoom from "@/components/staff/BreakRoom";
import MeetingRoom from "@/components/staff/MeetingRoom";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import NotificationsBar from "@/components/staff/NotificationsBar";
import TeamHeadWorkspace from "@/components/staff/TeamHeadWorkspace";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

const EMOJI_OPTIONS = [
  "😀", "😃", "😄", "😁", "😊", "🙂", "😎", "🤩", "🥳", "😇",
  "🤗", "🤔", "🤫", "🤭", "🧐", "🤓", "😏", "😌", "😴", "🤤",
  "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛",
  "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤥",
  "🦊", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
  "🍎", "🍌", "🍇", "🍉", "🍓", "🍒", "🍑", "🥝", "🍍", "🥥",
  "⚽", "🏀", "🎾", "🏐", "🏈", "⚾", "🥎", "🎱", "🏓", "🏸",
  "🎮", "🎯", "🎲", "🎭", "🎨", "🎬", "🎪", "🎡", "🎢", "🎰",
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎻", "🥁", "📱",
  "💻", "⌨️", "🖥️", "🖨️", "📷", "📺", "🕹️", "💡", "🔔", "🔕"
];

const TeamHeadDashboard = () => {
  const navigate = useNavigate();
  const [currentRoom, setCurrentRoom] = useState<RoomType>('workspace');
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showEmojiDialog, setShowEmojiDialog] = useState(false);
  const [newEmojiPassword, setNewEmojiPassword] = useState<string[]>([]);
  const [confirmEmojiPassword, setConfirmEmojiPassword] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", about_me: "" });
  const { profile } = useStaffData();

  useEffect(() => {
    checkDailyRequirements();
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        about_me: (profile as any).about_me || "",
      });
    }
  }, [profile?.user_id, profile?.full_name]);

  // Set up presence tracking for online users
  useEffect(() => {
    if (!profile?.user_id || !profile?.full_name) return;

    const channel = supabase.channel('team-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence state:', state);
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Tracking presence for:', profile.full_name);
          await channel.track({
            user_id: profile.user_id,
            full_name: profile.full_name,
            username: profile.username || 'user',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.user_id, profile?.full_name, profile?.username]);

  const checkDailyRequirements = async () => {
    if (!profile?.user_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has marked attendance today
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      // Check if user has submitted mood today
      const { data: moodData, error: moodError } = await supabase
        .from('user_mood_entries')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      console.log('Attendance today:', attendanceData);
      console.log('Mood today:', moodData);

      if (!attendanceData) {
        // No attendance marked - show attendance checker
        setShowAttendanceCheck(true);
        setShowMoodCheck(false);
      } else if (!moodData) {
        // Attendance marked but no mood - show mood checker
        setShowAttendanceCheck(false);
        setShowMoodCheck(true);
      } else {
        // Both completed - go to dashboard
        setShowAttendanceCheck(false);
        setShowMoodCheck(false);
      }
    } catch (error) {
      console.error('Error checking daily requirements:', error);
      // On error, just show attendance check
      setShowAttendanceCheck(true);
      setShowMoodCheck(false);
    }
  };

  const handleAttendanceMarked = () => {
    console.log('Attendance marked, now showing mood check');
    setShowAttendanceCheck(false);
    setShowMoodCheck(true);
  };


  const handleMoodSubmitted = () => {
    console.log('Mood submitted, going to dashboard');
    setShowMoodCheck(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff/login");
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({
          full_name: profileForm.full_name,
          about_me: profileForm.about_me,
        })
        .eq("user_id", profile?.user_id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setShowProfileDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const addEmojiToPassword = (emoji: string, isConfirm: boolean) => {
    if (isConfirm) {
      if (confirmEmojiPassword.length < 6) {
        setConfirmEmojiPassword([...confirmEmojiPassword, emoji]);
      }
    } else {
      if (newEmojiPassword.length < 6) {
        setNewEmojiPassword([...newEmojiPassword, emoji]);
      }
    }
  };

  const handleSetEmojiPassword = async () => {
    if (newEmojiPassword.length !== 6) {
      toast.error("Please select exactly 6 emojis");
      return;
    }

    if (JSON.stringify(newEmojiPassword) !== JSON.stringify(confirmEmojiPassword)) {
      toast.error("Emoji passwords don't match");
      return;
    }

    try {
      const emojiPasswordString = newEmojiPassword.join("");
      
      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({
          emoji_password: emojiPasswordString,
          is_emoji_password: true,
        })
        .eq('user_id', profile?.user_id);

      if (updateError) throw updateError;

      const { error: authError } = await supabase.auth.updateUser({
        password: emojiPasswordString
      });

      if (authError) throw authError;

      toast.success("Emoji password updated successfully");
      setShowEmojiDialog(false);
      setNewEmojiPassword([]);
      setConfirmEmojiPassword([]);
    } catch (error) {
      console.error('Error setting emoji password:', error);
      toast.error("Failed to update emoji password");
    }
  };

  // Show attendance check first
  if (showAttendanceCheck) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>
          <img 
            src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png" 
            alt="Modern office background" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        </div>
        
        <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Step 1: Mark Attendance</h2>
              <p className="text-white/80">Please mark your attendance to continue</p>
            </div>
            {profile?.user_id && (
              <AttendanceChecker 
                userId={profile.user_id} 
                onAttendanceMarked={handleAttendanceMarked}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show mood check after attendance
  if (showMoodCheck) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>
          <img 
            src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png" 
            alt="Modern office background" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        </div>
        
        <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Step 2: Daily Mood & Quote</h2>
              <p className="text-white/80">Share how you're feeling today and get inspired!</p>
            </div>
            {profile?.user_id && (
              <MoodQuoteChecker 
                userId={profile.user_id} 
                onMoodSubmitted={handleMoodSubmitted}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const roomComponents = {
    workspace: <TeamHeadWorkspace userId={profile?.user_id || 'demo-user'} userProfile={profile} />,
    breakroom: <BreakRoom />,
    meeting: <MeetingRoom />
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>
        <img 
          src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png" 
          alt="Modern office background" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <img 
          src="/lovable-uploads/508d91e4-1f4c-42a4-9e98-bcb4df6e023d.png" 
          alt="Office meeting space" 
          className="absolute top-1/2 left-1/2 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
      </div>
      
      {/* Office Header */}
      <header className="relative z-20 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2">
                <img 
                  src="/lovable-uploads/3268a3ac-c0c1-40de-8ba7-8f1b1099460e.png" 
                  alt="VAW Technologies Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">VAW Technologies</h1>
                <p className="text-blue-300 text-sm sm:text-base">
                  <Settings className="inline w-4 h-4 mr-1" />
                  Team Head: {profile?.full_name || profile?.username || 'Team Leader'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="order-3 sm:order-1">
                <NotificationsBar userId={profile?.user_id || 'demo-user'} />
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-2 sm:px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs sm:text-sm">Online</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-yellow-500/30 rounded-lg px-2 sm:px-3 py-1">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                <span className="text-yellow-300 text-xs sm:text-sm">${profile?.earnings || 0}</span>
              </div>
              
              <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                Team Head
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profile_photo_url} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                    <User className="mr-2 h-4 w-4" />
                    View/Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowEmojiDialog(true)}>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Emoji Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <VirtualOfficeLayout 
        currentRoom={currentRoom} 
        onRoomChange={setCurrentRoom}
        onlineUsers={onlineUsers}
      >
        {roomComponents[currentRoom]}
      </VirtualOfficeLayout>

      {/* Profile Edit Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.profile_photo_url} />
                <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={(profile as any)?.email || ''} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about_me">About Me</Label>
              <Textarea
                id="about_me"
                rows={3}
                value={profileForm.about_me}
                onChange={(e) => setProfileForm({ ...profileForm, about_me: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emoji Password Dialog */}
      <Dialog open={showEmojiDialog} onOpenChange={setShowEmojiDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Emoji Password</DialogTitle>
            <DialogDescription>Select 6 emojis for your new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Emoji Password (6 emojis)</Label>
              <div className="flex gap-2 p-4 bg-muted rounded-lg min-h-[60px] items-center justify-center">
                {newEmojiPassword.map((emoji, idx) => (
                  <span key={idx} className="text-3xl">{emoji}</span>
                ))}
                {newEmojiPassword.length < 6 && (
                  <span className="text-muted-foreground">Select {6 - newEmojiPassword.length} more</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewEmojiPassword([])}
                disabled={newEmojiPassword.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Confirm Emoji Password</Label>
              <div className="flex gap-2 p-4 bg-muted rounded-lg min-h-[60px] items-center justify-center">
                {confirmEmojiPassword.map((emoji, idx) => (
                  <span key={idx} className="text-3xl">{emoji}</span>
                ))}
                {confirmEmojiPassword.length < 6 && newEmojiPassword.length === 6 && (
                  <span className="text-muted-foreground">Confirm {6 - confirmEmojiPassword.length} more</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEmojiPassword([])}
                disabled={confirmEmojiPassword.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-10 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
              {EMOJI_OPTIONS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (newEmojiPassword.length < 6) {
                      addEmojiToPassword(emoji, false);
                    } else if (confirmEmojiPassword.length < 6) {
                      addEmojiToPassword(emoji, true);
                    }
                  }}
                  className="text-2xl hover:bg-accent p-2 rounded transition-colors"
                  disabled={newEmojiPassword.length >= 6 && confirmEmojiPassword.length >= 6}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <Button 
              onClick={handleSetEmojiPassword} 
              className="w-full"
              disabled={newEmojiPassword.length !== 6 || confirmEmojiPassword.length !== 6}
            >
              Update Emoji Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamHeadDashboard;