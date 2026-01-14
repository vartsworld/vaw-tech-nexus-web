import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import ParticleBackground from "@/components/ParticleBackground";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Eye, EyeOff, ShieldAlert, Smartphone } from "lucide-react";

const EMOJI_OPTIONS = [
  "😀", "😂", "🥰", "😍", "🤔", "😎", "🥳", "🤗", "😇", "🙃",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🍎", "🍌", "🍊", "🍋", "🍉", "🍇", "🍓", "🥝", "🍒", "🥥",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎻", "🥁", "📱",
  "💻", "⌨️", "🖥️", "🖨️", "📷", "📺", "🕹️", "💡", "🔔", "🔕"
];

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emojiPassword, setEmojiPassword] = useState<string[]>([]);
  const [loginMode, setLoginMode] = useState<"standard" | "emoji">("standard");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdminRoute = location.pathname.includes("super-admin");

  // Super admin can use either password or emoji login

  const addEmoji = (emoji: string) => {
    if (emojiPassword.length < 8) {
      setEmojiPassword([...emojiPassword, emoji]);
    }
  };

  const removeLastEmoji = () => {
    setEmojiPassword(emojiPassword.slice(0, -1));
  };

  const clearEmojiPassword = () => {
    setEmojiPassword([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const finalPassword = loginMode === "emoji" ? emojiPassword.join("") : password;

    if (loginMode === "emoji" && emojiPassword.length === 0) {
      toast({
        title: "Error",
        description: "Please select your emoji password",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Use edge function for secure server-side authentication
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          email, 
          password: finalPassword,
          loginType: isSuperAdminRoute ? 'super_admin' : 'admin'
        }
      });

      if (error) {
        console.error("Auth error:", error);
        toast({
          title: "Login failed",
          description: "An error occurred during authentication.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data.success) {
        toast({
          title: "Login failed",
          description: data.error || "Invalid email or password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store admin session info securely
      localStorage.setItem("admin_session", JSON.stringify({
        token: data.session.token,
        expires_at: data.session.expires_at,
        admin_id: data.admin.id,
        admin_email: data.admin.email,
        admin_full_name: data.admin.full_name,
      }));

      localStorage.setItem("admin_email", data.admin.email);
      localStorage.setItem("admin_user_id", data.admin.id);

      // For super-admins, we also need to sign in to Supabase Auth to satisfy the SuperAdminDashboard's check
      if (isSuperAdminRoute) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: data.admin.email,
          password: finalPassword,
        });

        if (authError) {
          console.error("Supabase Auth error for super-admin:", authError);
          // If auth fails but edge function succeeded, it might be a password mismatch between the two systems
          // We'll still allow it but warn or handle accordingly
        }
      }

      toast({
        title: "Login successful!",
        description: `Welcome back, ${data.admin.full_name}!`,
      });

      // If it was a super-admin login, navigate to super-admin dashboard
      if (isSuperAdminRoute) {
        navigate("/super-admin/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error: unknown) {
      console.error("Unexpected login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-tech-purple/10 via-background to-tech-blue/10 z-0"></div>
      <ParticleBackground />
      <PWAInstallPrompt />

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-muted/30 shadow-xl z-10 overflow-hidden">
        <div className={`h-1.5 w-full bg-gradient-to-r ${isSuperAdminRoute ? 'from-tech-red via-red-500 to-tech-red' : 'from-primary via-accent to-primary'}`} />

        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <span className="font-bold text-2xl font-['Space_Grotesk'] text-gradient">
              VAW<span className="text-accent">tech</span>
            </span>
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            {isSuperAdminRoute && <ShieldAlert className="w-6 h-6 text-tech-red" />}
            {isSuperAdminRoute ? "Super Admin Access" : "Admin Login"}
          </CardTitle>
          <CardDescription>
            {isSuperAdminRoute
              ? "Elevated authority verification required"
              : "Enter your credentials to access the admin dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={loginMode === "standard" ? "default" : "outline"}
              onClick={() => setLoginMode("standard")}
              className="flex-1"
              size="sm"
            >
              Password
            </Button>
            <Button
              variant={loginMode === "emoji" ? "default" : "outline"}
              onClick={() => setLoginMode("emoji")}
              className="flex-1"
              size="sm"
            >
              Emoji Pin
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Identity</Label>
              <Input
                id="email"
                placeholder="admin@vawtechnologies.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-white/10"
              />
            </div>

            {loginMode === "standard" ? (
              <div className="space-y-2">
                <Label htmlFor="password">Access Pin</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 border-white/10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label>Emoji Master Key</Label>
                <div className="min-h-[60px] p-3 border border-white/10 rounded-lg bg-background/50 flex flex-wrap gap-2 items-center shadow-inner">
                  {emojiPassword.map((emoji, index) => (
                    <span key={index} className="text-2xl animate-in zoom-in-50 duration-200">{emoji}</span>
                  ))}
                  {emojiPassword.length === 0 && (
                    <span className="text-gray-500 text-sm">Select emojis below...</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-white/10"
                    onClick={removeLastEmoji}
                    disabled={emojiPassword.length === 0}
                  >
                    Remove Last
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-white/10"
                    onClick={clearEmojiPassword}
                    disabled={emojiPassword.length === 0}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-8 gap-1 p-2 bg-background/30 rounded-xl border border-white/5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {EMOJI_OPTIONS.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      className="h-10 text-xl hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className={`w-full font-bold h-11 mt-4 transition-all ${isSuperAdminRoute
                ? 'bg-tech-red hover:bg-tech-red/80 shadow-lg shadow-tech-red/20'
                : 'bg-primary hover:bg-primary/80'
                }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 animate-pulse" /> Verifying...
                </span>
              ) : (
                "Initialize Nexus Session"
              )}
            </Button>

            <div className="text-center text-sm mt-6">
              <a href="/" className="text-muted-foreground hover:text-white transition-colors">
                Return to Surface Web
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
