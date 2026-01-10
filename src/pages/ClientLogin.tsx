import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const ClientLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Allow any authenticated user to access the client portal
                // This enables clients, PAs, assistants, or anyone with valid credentials to access
                toast.success("Welcome to your dashboard!");
                navigate("/client/dashboard");
            }
        } catch (error: any) {
            console.error("Login error:", error);
            toast.error(error.message || "Invalid login credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-cyber-grid pointer-events-none opacity-20" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-tech-gold/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-tech-red/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8 space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-tech-gold/10 border border-tech-gold/30 rounded-2xl mb-2 backdrop-blur-xl">
                        <img
                            src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                            alt="VAW Tech Logo"
                            className="w-12 h-12 rounded-xl object-cover shadow-2xl"
                        />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">
                        CLIENT <span className="text-tech-gold">NEXUS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium">Elevating your digital journey with precision.</p>
                </div>

                <Card className="border-tech-gold/20 shadow-2xl bg-black/40 backdrop-blur-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-gold via-tech-red to-tech-gold" />

                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold text-white">Secure Login</CardTitle>
                            <ShieldCheck className="w-5 h-5 text-tech-gold opacity-50" />
                        </div>
                        <CardDescription className="text-gray-400">
                            Access your personalized project ecosystem
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-300">Email Identity</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-tech-gold transition-colors group-focus-within:text-white" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="client@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-600 focus:border-tech-gold focus:ring-tech-gold/20 transition-all h-12 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-300">Nexus Pin</Label>
                                    <button type="button" className="text-xs text-tech-gold hover:text-white transition-colors">Forgot Access?</button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-tech-gold transition-colors group-focus-within:text-white" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-600 focus:border-tech-gold focus:ring-tech-gold/20 transition-all h-12 rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-tech-gold hover:bg-white text-black font-bold h-12 rounded-xl transition-all duration-500 shadow-lg shadow-tech-gold/20"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Initialize Session <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <div className="px-6 pb-6 text-center">
                        <p className="text-xs text-gray-500">
                            By accessing the Nexus, you agree to our <span className="text-gray-400 hover:text-white cursor-pointer underline">Mutual Agreement</span> and <span className="text-gray-400 hover:text-white cursor-pointer underline">Data Protocols</span>.
                        </p>
                    </div>
                </Card>

                {/* Support Link */}
                <div className="mt-8 text-center flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-500">Need assistance gaining entry?</p>
                    <Button variant="link" className="text-tech-gold font-bold hover:text-white p-0 h-auto">
                        Contact Support Nexus
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default ClientLogin;
