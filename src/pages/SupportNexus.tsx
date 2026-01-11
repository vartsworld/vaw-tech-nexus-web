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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">SUPPORT <span className="text-tech-gold uppercase">CENTER</span></h1>
                    <p className="text-gray-400 font-medium italic">Direct support channel.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-tech-gold/30 text-tech-gold hover:bg-tech-gold/10 font-bold h-12 px-6 rounded-xl">
                        <PhoneCall className="w-4 h-4 mr-2" /> Phone Support
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Support Form */}
                <Card className="lg:col-span-2 bg-black/40 backdrop-blur-xl border-tech-gold/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-gold to-transparent opacity-50" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <MessageSquare className="w-5 h-5 text-tech-gold" />
                            Create Ticket
                        </CardTitle>
                        <CardDescription>
                            Submit a new support request.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-gray-400">Issue Type</Label>
                                <Select value={newSignal.type} onValueChange={(v) => setNewSignal({ ...newSignal, type: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical Issue</SelectItem>
                                        <SelectItem value="billing">Billing Inquiry</SelectItem>
                                        <SelectItem value="project">Project Update</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-gray-400">Priority</Label>
                                <Select value={newSignal.priority} onValueChange={(v) => setNewSignal({ ...newSignal, priority: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                                        <SelectValue placeholder="Select Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low Priority</SelectItem>
                                        <SelectItem value="medium">Medium Priority</SelectItem>
                                        <SelectItem value="high">High Priority</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-gray-400">Subject</Label>
                            <Input
                                id="subject"
                                value={newSignal.subject}
                                onChange={(e) => setNewSignal({ ...newSignal, subject: e.target.value })}
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                                placeholder="Brief description of the issue"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-gray-400">Details</Label>
                            <Textarea
                                id="message"
                                value={newSignal.message}
                                onChange={(e) => setNewSignal({ ...newSignal, message: e.target.value })}
                                className="bg-white/5 border-white/10 text-white min-h-[150px] rounded-xl"
                                placeholder="Provide detailed information about your request..."
                            />
                        </div>

                        <Button
                            onClick={handleSubmitSignal}
                            disabled={isSubmitting}
                            className="w-full bg-tech-gold hover:bg-white text-black font-bold h-12 rounded-xl transition-all shadow-lg shadow-tech-gold/20"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Sending...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    SUBMIT TICKET
                                </div>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* History & Stats */}
                <div className="space-y-6">
                    <Card className="bg-blue-500/10 border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Support SLA
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white">&lt; 2hr</span>
                                <span className="text-xs text-gray-400 mb-1.5">Response time</span>
                            </div>
                        </CardContent>
                    </Card>

                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-tech-gold" />
                        Ticket History
                    </h3>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
                        ) : signals.length > 0 ? (
                            signals.map((signal) => (
                                <div key={signal.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-tech-gold/30 transition-all group cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className={cn(
                                            "border-0 text-[10px] uppercase font-black px-1.5 py-0.5",
                                            signal.status === 'resolved' ? "bg-green-500/20 text-green-500" :
                                                signal.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                                                    "bg-blue-500/20 text-blue-500"
                                        )}>
                                            {signal.status}
                                        </Badge>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(signal.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-tech-gold transition-colors truncate">
                                        {signal.subject}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                        {signal.message}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8 italic">
                                No history found.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SupportNexus;
