import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    MessageSquare,
    Phone,
    AlertCircle,
    Bug,
    Lightbulb,
    MessageCircle,
    Clock,
    CheckCircle2,
    ChevronRight,
    Shield,
    Send,
    Loader2,
    HeadphonesIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const SupportNexus = ({ profile }: { profile: any }) => {
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [type, setType] = useState("feedback");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchFeedback();
    }, [profile]);

    const fetchFeedback = async () => {
        if (!profile) return;
        const { data } = await supabase
            .from("client_feedback")
            .select("*")
            .eq("client_id", profile.id)
            .order("created_at", { ascending: false });

        if (data) setFeedback(data);
        setLoading(false);
    };

    const handleSignalTransmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) {
            toast.error("Subject and signal content are required for transmission.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("client_feedback")
                .insert({
                    client_id: profile.id,
                    type,
                    subject,
                    message,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success("Signal successfully transmitted to the Nexus.");
            setSubject("");
            setMessage("");
            fetchFeedback();
        } catch (error: any) {
            toast.error(`Transmission failure: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const signalTypes = [
        { id: "feedback", label: "Strategic Feedback", icon: MessageCircle, color: "text-tech-gold" },
        { id: "bug_report", label: "Anomaly Report", icon: Bug, color: "text-tech-red" },
        { id: "update_request", label: "Asset Mutation", icon: Lightbulb, color: "text-blue-400" },
        { id: "support", label: "Direct Support", icon: HeadphonesIcon, color: "text-tech-purple" },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">SUPPORT <span className="text-tech-gold uppercase">NEXUS</span></h1>
                    <p className="text-gray-400 font-medium italic">Establishing direct connection protocols with the technical core.</p>
                </div>
                <div className="flex items-center gap-4 bg-tech-gold/10 border border-tech-gold/20 p-3 px-6 rounded-2xl">
                    <div className="p-2 bg-tech-gold rounded-full">
                        <Phone className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-tech-gold uppercase tracking-widest">Priority Hotline</p>
                        <p className="text-sm font-black text-white">+91 91100 85987</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Transmission Controller */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-gold via-tech-red to-tech-gold" />
                        <CardHeader>
                            <CardTitle className="text-2xl font-black text-white">Signal Transmitter</CardTitle>
                            <CardDescription className="text-gray-400 font-medium">Broadcast your signal across the nexus infrastructure.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSignalTransmission} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">Signal Vector</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black/90 border-tech-gold/20 text-white backdrop-blur-xl">
                                                {signalTypes.map(s => (
                                                    <SelectItem key={s.id} value={s.id} className="focus:bg-tech-gold/10 focus:text-tech-gold">
                                                        <div className="flex items-center gap-2">
                                                            <s.icon className={cn("w-4 h-4", s.color)} />
                                                            <span className="font-bold">{s.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">Signal Subject</Label>
                                        <Input
                                            placeholder="Core identification"
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">Signal Amplitude (Details)</Label>
                                    <Textarea
                                        placeholder="Detailed transmission content..."
                                        className="bg-white/5 border-tech-gold/20 text-white rounded-2xl min-h-[160px] focus:ring-tech-gold/20 font-medium"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-tech-gold hover:bg-white text-black font-black h-14 rounded-2xl transition-all shadow-xl shadow-tech-gold/10"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            INITIALIZE TRANSMISSION <Send className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Transmission Archive */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-tech-purple" />
                        Signal History
                    </h2>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)
                        ) : feedback.length > 0 ? (
                            feedback.map((f, i) => (
                                <motion.div
                                    key={f.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Card className="bg-white/5 border-white/5 hover:border-tech-gold/20 transition-all group overflow-hidden">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-black/40 rounded-lg group-hover:text-tech-gold transition-colors">
                                                        {signalTypes.find(t => t.id === f.type)?.icon({ className: "w-4 h-4" }) || <MessageCircle className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-tech-gold transition-colors truncate max-w-[150px]">{f.subject}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(f.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] uppercase font-black tracking-[0.1em]",
                                                    f.status === 'pending' ? "bg-tech-gold/10 text-tech-gold border-tech-gold/20" : "bg-green-500/10 text-green-500 border-green-500/20"
                                                )}>
                                                    {f.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2 font-medium bg-black/20 p-3 rounded-lg border border-white/5 italic">
                                                "{f.message}"
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-black/20 border border-dashed border-tech-gold/10 rounded-3xl opacity-40">
                                <Shield className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">No previous signal data found</p>
                            </div>
                        )}
                    </div>

                    <Card className="bg-tech-gold/5 border-tech-gold/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-tighter text-tech-gold">Nexus SLA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                Signal response latency is currently within the <span className="text-white font-bold">4-hour window</span> for Enterprise clients. Anomalies are prioritized for immediate technical remediation.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SupportNexus;
