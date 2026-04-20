import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserCheck, Smartphone, Fingerprint, User as UserIcon, Loader2 } from "lucide-react";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import vawLogo from "@/assets/vaw-logo.png";

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
  const [loginMode, setLoginMode] = useState<"first-time" | "emoji" | null>(null);
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [emojiPassword, setEmojiPassword] = useState<string[]>([]);
  const [isSettingEmoji, setIsSettingEmoji] = useState(false);
  const [newEmojiPassword, setNewEmojiPassword] = useState<string[]>([]);
  const [confirmEmojiPassword, setConfirmEmojiPassword] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<{ full_name?: string; avatar_url?: string; profile_photo_url?: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [optionsReady, setOptionsReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSupported: biometricSupported, isAuthenticating, authenticate, register: registerBiometric, isRegistering } = useBiometricAuth();

  // Debounced preview lookup when username is typed
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setPreviewProfile(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data: rawData } = await supabase
          .rpc('get_staff_login_details' as any, { p_username: trimmed })
          .maybeSingle();
        const data = rawData as any;
        if (data) {
          // Fetch biometric credential IDs using the new secure RPC to force local fingerprint sensor
          let bioIds = [];
          try {
            const { data: bData } = await supabase
              .rpc('get_staff_biometric_ids' as any, { p_user_id: data.user_id });
            bioIds = bData || [];
          } catch (e) {
            console.warn("Biometric RPC check failed:", e);
          }

          setPreviewProfile({
            user_id: data.user_id,
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            profile_photo_url: data.profile_photo_url,
            biometric_ids: bioIds || []
          });
        } else {
          setPreviewProfile(null);
        }
      } catch (err) {
        setPreviewProfile(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  // Stagger: hold options off until profile photo finishes its entrance
  useEffect(() => {
    if (previewProfile) {
      setOptionsReady(false);
      const t = setTimeout(() => setOptionsReady(true), 550);
      return () => clearTimeout(t);
    }
    setOptionsReady(false);
  }, [previewProfile?.full_name]);

  const checkTodayAttendance = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    return !error && data !== null;
  };

  const getDashboardRoute = (staffProfile: any) => {
    // Specific route for HR
    if (staffProfile.role === 'hr') {
      return '/hr/dashboard';
    }

    if (staffProfile.role === 'sales') {
      return '/sales/dashboard';
    }

    // Check if user is manager, lead, or department head
    if (staffProfile.role === 'manager' ||
      staffProfile.role === 'lead' ||
      staffProfile.is_department_head) {
      return '/team-head/dashboard';
    }
    return '/staff/dashboard';
  };

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
      // Use RPC to bypass RLS for fetching profile by username
      const { data: rawData, error } = await supabase
        .rpc('get_staff_login_details' as any, { p_username: username })
        .maybeSingle();

      const data = rawData as any;

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "System Error",
          description: "Could not access user directory",
          variant: "destructive",
        });
        return;
      }

      // Client-side validation since we can't filter protected columns in RLS-protected table easily for anon
      if (!data || data.first_time_passcode !== passcode || data.passcode_used !== false) {
        toast({
          title: "Invalid Credentials",
          description: "Username or passcode is incorrect, or passcode already used.",
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
          description: authError.message || "Failed to authenticate. Please contact HR.",
          variant: "destructive",
        });
        return;
      }

      if (!data.emoji_password) {
        // Store staff profile data for later use
        setUserProfile(data);
        setIsSettingEmoji(true);
        toast({
          title: "Welcome!",
          description: "Please set up your emoji password for future logins",
        });
      } else {
        // Check attendance and navigate to appropriate dashboard
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const hasMarkedAttendance = await checkTodayAttendance(authUser.id);
          const dashboardRoute = getDashboardRoute(data);
          if (!hasMarkedAttendance) {
            navigate(dashboardRoute, { state: { requireAttendance: true } });
          } else {
            navigate(dashboardRoute);
          }
        }
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
      // Use RPC to bypass RLS
      const { data: rawData, error } = await supabase
        .rpc('get_staff_login_details' as any, { p_username: username })
        .maybeSingle();

      const data = rawData as any;

      const inputEmojiPass = emojiPassword.join('');

      // Client-side validation
      if (error || !data || data.emoji_password !== inputEmojiPass || !data.is_emoji_password) {
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
        password: inputEmojiPass,
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Authentication Error",
          description: authError.message || "Failed to authenticate. Please contact HR.",
          variant: "destructive",
        });
        return;
      }

      // Get current user after successful login
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Check if attendance is marked for today
        const hasMarkedAttendance = await checkTodayAttendance(authUser.id);
        const dashboardRoute = getDashboardRoute(data);
        if (!hasMarkedAttendance) {
          navigate(dashboardRoute, { state: { requireAttendance: true } });
        } else {
          navigate(dashboardRoute);
        }
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

      // Get updated staff profile to determine dashboard route
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      toast({
        title: "Setup Complete!",
        description: "Emoji password set successfully! Please login to continue.",
      });

      // Redirect to login after a brief delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;

      if (profileToUse) {
        // Instead of dashboard, force a re-login to verify new credentials
        navigateAfterSetup();
      } else {
        navigateAfterSetup();
      }
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

  const handleBiometricLogin = async () => {
    // If we have previewed a profile and it has biometric IDs, pass them to force local sensor
    const allowedIds = (previewProfile as any)?.biometric_ids;
    const result = await authenticate(allowedIds);
    if (!result.success || !result.email) {
      toast({
        title: "Biometric Login Failed",
        description: "Could not verify your identity. Try emoji or passcode login.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const { data: fnData, error: fnError } = await supabase.functions.invoke('biometric-login', {
        body: { user_id: result.userId },
      });
      if (fnError || !fnData?.access_token) {
        toast({ title: "Biometric Login Failed", description: "Please use emoji or passcode login.", variant: "destructive" });
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: fnData.access_token,
        refresh_token: fnData.refresh_token,
      });
      if (sessionError) throw sessionError;
      const staffData = { role: result.role, is_department_head: result.isDepartmentHead };
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const hasMarkedAttendance = await checkTodayAttendance(authUser.id);
        const dashboardRoute = getDashboardRoute(staffData);
        navigate(!hasMarkedAttendance ? dashboardRoute : dashboardRoute, 
          !hasMarkedAttendance ? { state: { requireAttendance: true } } : undefined);
      }
    } catch (err) {
      console.error('Biometric sign-in error:', err);
      toast({ title: "Error", description: "Biometric login failed. Please try another method.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSetup = async () => {
    const success = await registerBiometric();
    toast(success
      ? { title: "Fingerprint Registered!", description: "You can now use fingerprint to log in." }
      : { title: "Setup Failed", description: "Could not register fingerprint. You can try later in settings.", variant: "destructive" as const });
    navigateAfterSetup();
  };

  const skipBiometricSetup = () => navigateAfterSetup();

  const navigateAfterSetup = async () => {
    toast({
      title: "Setup Complete!",
      description: "Please log in again with your new credentials.",
    });
    // Sign out to clear the temporary first-time session
    await supabase.auth.signOut();
    // Refresh page to take them back to the start (username entry)
    window.location.reload();
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

  if (showBiometricSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
              <Fingerprint className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Enable Fingerprint Login?</CardTitle>
            <p className="text-gray-600">Use your fingerprint for quick & secure login next time</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleBiometricSetup}
              disabled={isRegistering}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isRegistering ? "Registering..." : "Enable Fingerprint"}
            </Button>
            <Button
              variant="ghost"
              onClick={skipBiometricSetup}
              className="w-full"
            >
              Skip for now
            </Button>
            <p className="text-xs text-center text-gray-500">
              You can enable this later in your profile settings
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <PWAInstallPrompt />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative h-20 w-20">
            {/* Default VAW logo - fades out when profile found */}
            <div
              className={`absolute inset-0 rounded-full overflow-hidden ring-4 ring-blue-200 shadow-lg bg-[#f5efdf] flex items-center justify-center transition-all duration-500 ease-out ${
                previewProfile ? "opacity-0 scale-75 rotate-12" : "opacity-100 scale-100 rotate-0"
              }`}
            >
              <img
                src={vawLogo}
                alt="VAW Technologies"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Profile photo - fades in when found */}
            <div
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                previewProfile ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-12"
              }`}
            >
              <Avatar className="h-20 w-20 ring-4 ring-blue-200 shadow-lg">
                {(previewProfile?.profile_photo_url || previewProfile?.avatar_url) && (
                  <AvatarImage
                    src={previewProfile?.profile_photo_url || previewProfile?.avatar_url}
                    alt={previewProfile?.full_name || username}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {previewProfile?.full_name ? previewProfile.full_name.charAt(0).toUpperCase() : <UserIcon className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
            </div>
            {previewLoading && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 border-2 border-white animate-pulse" />
            )}
          </div>
          <CardTitle className="text-2xl transition-all duration-300">
            {previewProfile?.full_name ? `Hi, ${previewProfile.full_name.split(" ")[0]}` : "Staff Login"}
          </CardTitle>
          <p className="text-gray-600 transition-all duration-300">
            {previewProfile ? "Welcome back 👋" : "Access your workspace"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* STEP 1: Username input */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
            />
            {username.trim().length > 0 && !previewLoading && !previewProfile && (
              <p className="mt-2 text-xs text-gray-500">No matching user found</p>
            )}
          </div>

          {/* STEP 2: Method picker — animated reveal once profile is found */}
          {previewProfile && (
            <div className="space-y-4">
              {!loginMode ? (
                <div className="space-y-3">
                  <p
                    className={`text-center text-sm text-gray-600 font-medium transition-all duration-500 ease-out ${
                      optionsReady ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    }`}
                  >
                    Choose how to sign in
                  </p>
                  <div className="grid gap-3">
                    {biometricSupported && (
                      <button
                        onClick={handleBiometricLogin}
                        disabled={isAuthenticating || loading || !optionsReady}
                        style={{ transitionDelay: optionsReady ? "120ms" : "0ms" }}
                        className={`group flex items-center gap-4 p-4 rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-lg hover:scale-[1.02] transition-all duration-700 ease-out text-left ${
                          optionsReady ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                        }`}
                      >
                        <div className="p-3 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                          <Fingerprint className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-800">
                            {isAuthenticating ? "Verifying…" : "Fingerprint"}
                          </p>
                          <p className="text-xs text-green-600">Quick & secure unlock</p>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={() => setLoginMode("emoji")}
                      disabled={!optionsReady}
                      style={{ transitionDelay: optionsReady ? "260ms" : "0ms" }}
                      className={`group flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] transition-all duration-700 ease-out text-left ${
                        optionsReady ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                      }`}
                    >
                      <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <span className="text-2xl">🔐</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-blue-800">Emoji Password</p>
                        <p className="text-xs text-blue-600">Tap your secret emojis</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setLoginMode("first-time")}
                      disabled={!optionsReady}
                      style={{ transitionDelay: optionsReady ? "400ms" : "0ms" }}
                      className={`group flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 hover:border-amber-400 hover:shadow-lg hover:scale-[1.02] transition-all duration-700 ease-out text-left ${
                        optionsReady ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                      }`}
                    >
                      <div className="p-3 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
                        <Smartphone className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-800">First Time Passcode</p>
                        <p className="text-xs text-amber-600">Use your one-time HR code</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <button
                    onClick={() => setLoginMode(null as any)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    ← Choose different method
                  </button>

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
                          autoFocus
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
                </div>
              )}
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact HR for assistance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLogin;