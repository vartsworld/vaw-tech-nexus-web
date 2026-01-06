import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ParticleBackground from "@/components/ParticleBackground";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use edge function for secure server-side authentication
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { email, password }
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
      // Note: For production, consider using httpOnly cookies via the edge function
      sessionStorage.setItem("admin_session", JSON.stringify({
        token: data.session.token,
        expires_at: data.session.expires_at,
        admin_id: data.admin.id,
        admin_email: data.admin.email,
        admin_full_name: data.admin.full_name,
      }));
      
      toast({
        title: "Login successful!",
        description: `Welcome back, ${data.admin.full_name}!`,
      });
      
      navigate("/admin/dashboard");
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
      
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-muted/30 shadow-xl z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <span className="font-bold text-2xl font-['Space_Grotesk'] text-gradient">
              VAW<span className="text-accent">tech</span>
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                placeholder="admin@vawtechnologies.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/80" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center text-sm mt-6">
              <a href="/" className="text-accent hover:text-accent/80">
                Return to Website
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
