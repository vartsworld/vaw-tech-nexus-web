
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      // In a real application, this would verify credentials with a backend
      
      // Mock credentials for demo purposes only
      if (email === "admin@vawtechnologies.com" && password === "admin123") {
        // Store mock token (in a real app, this would be a JWT or similar)
        localStorage.setItem("admin_token", "mock_token_12345");
        
        toast({
          title: "Login successful!",
          description: "Welcome to the admin dashboard.",
        });
        
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-tech-purple/10 via-background to-tech-blue/10 z-0"></div>
      <ParticleBackground />
      
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

// To avoid code duplication, we're reusing the ParticleBackground component
// with simplified settings for the login page
const ParticleBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
      <div className="particle-container">
        {Array.from({ length: 20 }).map((_, i) => {
          const size = Math.random() * 6 + 1;
          const animationDuration = Math.random() * 20 + 10;
          const opacity = Math.random() * 0.5 + 0.1;
          
          return (
            <div
              key={i}
              className="particle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#9b87f5', '#1EAEDB', '#33C3F0'][Math.floor(Math.random() * 3)],
                opacity,
                animation: `float ${animationDuration}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AdminLogin;
