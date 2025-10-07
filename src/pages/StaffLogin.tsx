import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserCheck, Smartphone } from "lucide-react";

const EMOJI_OPTIONS = [
  "😀", "😂", "🥰", "😍", "🤔", "😎", "🥳", "🤗", "😇", "🙃",
  "😴", "🤤", "😋", "🧐", "🤓", "😏", "🥺", "😢", "😭", "😤",
  "🤯", "🥴", "🤠", "🥶", "🥵", "😱", "🤗", "🤫", "🤭", "🙄",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
  "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕",
  "🍎", "🍌", "🍊", "🍋", "🍉", "🍇", "🍓", "🥝", "🍒", "🥥",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎻", "🥁", "📱",
  "💻", "⌨️", "🖥️", "🖨️", "📷", "📺", "🕹️", "💡", "🔔", "🔕"
];

const StaffLogin = () => {
  const [loginMode, setLoginMode] = useState<"first-time" | "emoji">("first-time");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [emojiPassword, setEmojiPassword] = useState<string[]>([]);
  const [isSettingEmoji, setIsSettingEmoji] = useState(false);
  const [newEmojiPassword, setNewEmojiPassword] = useState<string[]>([]);
  const [confirmEmojiPassword, setConfirmEmojiPassword] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFirstTimeLogin = async () => {
    if (!username || !passcode) {
      toast({
        title: "Error",
        description: "Please enter both username and passcode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('username', username)
        .eq('first_time_passcode', passcode)
        .eq('passcode_used', false)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Credentials",
          description: "Username or passcode is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Sign in with Supabase auth using email and passcode
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: passcode,
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Authentication Error",
          description: "Failed to authenticate. Please contact HR.",
          variant: "destructive",
        });
        return;
      }

      if (!data.emoji_password) {
        setIsSettingEmoji(true);
        toast({
          title: "Welcome!",
          description: "Please set up your emoji password for future logins",
        });
      } else {
        navigate('/staff/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiLogin = async () => {
    if (emojiPassword.length === 0) {
      toast({
        title: "Error",
        description: "Please select your emoji password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('username', username)
        .eq('emoji_password', emojiPassword.join(''))
        .eq('is_emoji_password', true)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Credentials",
          description: "Username or emoji password is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Sign in with Supabase auth using email and emoji password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: emojiPassword.join(''),
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Authentication Error",
          description: "Failed to authenticate. Please contact HR.",
          variant: "destructive",
        });
        return;
      }

      navigate('/staff/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetEmojiPassword = async () => {
    if (newEmojiPassword.length < 4) {
      toast({
        title: "Error",
        description: "Please select at least 4 emojis for your password",
        variant: "destructive",
      });
      return;
    }

    if (newEmojiPassword.join('') !== confirmEmojiPassword.join('')) {
      toast({
        title: "Error",
        description: "Emoji passwords don't match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Not authenticated. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }

      const emojiPass = newEmojiPassword.join('');

      // Update emoji password in database
      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({
          emoji_password: emojiPass,
          is_emoji_password: true,
          passcode_used: true
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update auth password to emoji password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: emojiPass
      });

      if (passwordError) throw passwordError;

      toast({
        title: "Success",
        description: "Emoji password set successfully!",
      });

      navigate('/staff/dashboard');
    } catch (error) {
      console.error('Error setting emoji password:', error);
      toast({
        title: "Error",
        description: "Failed to set emoji password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmojiToPassword = (emoji: string, isConfirm = false) => {
    if (isConfirm) {
      if (confirmEmojiPassword.length < 8) {
        setConfirmEmojiPassword([...confirmEmojiPassword, emoji]);
      }
    } else if (isSettingEmoji) {
      if (newEmojiPassword.length < 8) {
        setNewEmojiPassword([...newEmojiPassword, emoji]);
      }
    } else {
      if (emojiPassword.length < 8) {
        setEmojiPassword([...emojiPassword, emoji]);
      }
    }
  };

  const removeLastEmoji = (isConfirm = false) => {
    if (isConfirm) {
      setConfirmEmojiPassword(confirmEmojiPassword.slice(0, -1));
    } else if (isSettingEmoji) {
      setNewEmojiPassword(newEmojiPassword.slice(0, -1));
    } else {
      setEmojiPassword(emojiPassword.slice(0, -1));
    }
  };

  const clearPassword = (isConfirm = false) => {
    if (isConfirm) {
      setConfirmEmojiPassword([]);
    } else if (isSettingEmoji) {
      setNewEmojiPassword([]);
    } else {
      setEmojiPassword([]);
    }
  };

  if (isSettingEmoji) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Set Your Emoji Password</CardTitle>
            <p className="text-gray-600">Choose 4-8 emojis for secure login</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>New Emoji Password</Label>
              <div className="min-h-[60px] p-3 border rounded-lg bg-gray-50 flex flex-wrap gap-2 items-center">
                {newEmojiPassword.map((emoji, index) => (
                  <span key={index} className="text-2xl">{emoji}</span>
                ))}
                {newEmojiPassword.length === 0 && (
                  <span className="text-gray-400">Select emojis below...</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLastEmoji()}
                  disabled={newEmojiPassword.length === 0}
                >
                  Remove Last
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearPassword()}
                  disabled={newEmojiPassword.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div>
              <Label>Confirm Emoji Password</Label>
              <div className="min-h-[60px] p-3 border rounded-lg bg-gray-50 flex flex-wrap gap-2 items-center">
                {confirmEmojiPassword.map((emoji, index) => (
                  <span key={index} className="text-2xl">{emoji}</span>
                ))}
                {confirmEmojiPassword.length === 0 && (
                  <span className="text-gray-400">Confirm your password...</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLastEmoji(true)}
                  disabled={confirmEmojiPassword.length === 0}
                >
                  Remove Last
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearPassword(true)}
                  disabled={confirmEmojiPassword.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {EMOJI_OPTIONS.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="p-2 h-10 text-xl hover:bg-blue-100"
                  onClick={() => addEmojiToPassword(emoji, newEmojiPassword.length >= 4 && confirmEmojiPassword.length < newEmojiPassword.length)}
                >
                  {emoji}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleSetEmojiPassword}
              disabled={loading || newEmojiPassword.length < 4}
              className="w-full"
            >
              {loading ? "Setting Password..." : "Set Emoji Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Staff Login</CardTitle>
          <p className="text-gray-600">Access your workspace</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={loginMode === "first-time" ? "default" : "outline"}
              onClick={() => setLoginMode("first-time")}
              className="flex-1"
            >
              First Time
            </Button>
            <Button
              variant={loginMode === "emoji" ? "default" : "outline"}
              onClick={() => setLoginMode("emoji")}
              className="flex-1"
            >
              Emoji Login
            </Button>
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          {loginMode === "first-time" ? (
            <div>
              <Label htmlFor="passcode">First Time Passcode</Label>
              <div className="relative">
                <Input
                  id="passcode"
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter your passcode"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPasscode(!showPasscode)}
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Label>Emoji Password</Label>
              <div className="min-h-[60px] p-3 border rounded-lg bg-gray-50 flex flex-wrap gap-2 items-center">
                {emojiPassword.map((emoji, index) => (
                  <span key={index} className="text-2xl">{emoji}</span>
                ))}
                {emojiPassword.length === 0 && (
                  <span className="text-gray-400">Select your emoji password...</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLastEmoji()}
                  disabled={emojiPassword.length === 0}
                >
                  Remove Last
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearPassword()}
                  disabled={emojiPassword.length === 0}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg mt-2">
                {EMOJI_OPTIONS.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="p-2 h-10 text-xl hover:bg-blue-100"
                    onClick={() => addEmojiToPassword(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={loginMode === "first-time" ? handleFirstTimeLogin : handleEmojiLogin}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact HR for assistance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLogin;