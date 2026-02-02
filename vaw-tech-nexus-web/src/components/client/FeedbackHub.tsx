import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MessageSquare,
    Lightbulb,
    ThumbsUp,
    Send,
    Loader2,
    CheckCircle2,
    Clock,
    Star,
    TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeedbackHubProps {
    clientId: string;
}

const FeedbackHub = ({ clientId }: FeedbackHubProps) => {
    const [activeTab, setActiveTab] = useState("feedback");

    // Feedback state
    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackCategory, setFeedbackCategory] = useState("general");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [myFeedback, setMyFeedback] = useState<any[]>([]);

    // Feature request state
    const [featureTitle, setFeatureTitle] = useState("");
    const [featureDescription, setFeatureDescription] = useState("");
    const [featureCategory, setFeatureCategory] = useState("enhancement");
    const [submittingFeature, setSubmittingFeature] = useState(false);
    const [featureRequests, setFeatureRequests] = useState<any[]>([]);
    const [myFeatureRequests, setMyFeatureRequests] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch my feedback
            const { data: feedback } = await supabase
                .from("client_feedback")
                .select("*")
                .eq("client_id", clientId)
                .order("created_at", { ascending: false });

            setMyFeedback(feedback || []);

            // Fetch all feature requests (for upvoting)
            const { data: allFeatures } = await supabase
                .from("client_feature_requests")
                .select("*")
                .order("upvotes", { ascending: false })
                .limit(20);

            setFeatureRequests(allFeatures || []);

            // Fetch my feature requests
            const { data: myFeatures } = await supabase
                .from("client_feature_requests")
                .select("*")
                .eq("client_id", clientId)
                .order("created_at", { ascending: false });

            setMyFeatureRequests(myFeatures || []);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackText.trim() || rating === 0) {
            toast.error("Please provide a rating and feedback");
            return;
        }

        setSubmittingFeedback(true);

        try {
            const { error } = await supabase
                .from("client_feedback")
                .insert({
                    client_id: clientId,
                    feedback: feedbackText.trim(),
                    category: feedbackCategory,
                    rating: rating,
                    status: "submitted"
                });

            if (error) throw error;

            toast.success("Thank you for your feedback!");

            // Reset form
            setFeedbackText("");
            setRating(0);
            setFeedbackCategory("general");

            // Refresh data
            fetchData();

        } catch (error: any) {
            console.error("Error submitting feedback:", error);
            toast.error(error.message || "Failed to submit feedback");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleSubmitFeatureRequest = async () => {
        if (!featureTitle.trim() || !featureDescription.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setSubmittingFeature(true);

        try {
            const { error } = await supabase
                .from("client_feature_requests")
                .insert({
                    client_id: clientId,
                    title: featureTitle.trim(),
                    description: featureDescription.trim(),
                    category: featureCategory,
                    status: "submitted",
                    upvotes: 0
                });

            if (error) throw error;

            toast.success("Feature request submitted successfully!");

            // Reset form
            setFeatureTitle("");
            setFeatureDescription("");
            setFeatureCategory("enhancement");

            // Refresh data
            fetchData();

        } catch (error: any) {
            console.error("Error submitting feature request:", error);
            toast.error(error.message || "Failed to submit feature request");
        } finally {
            setSubmittingFeature(false);
        }
    };

    const handleUpvote = async (featureId: string, currentUpvotes: number) => {
        try {
            const { error } = await supabase
                .from("client_feature_requests")
                .update({ upvotes: currentUpvotes + 1 })
                .eq("id", featureId);

            if (error) throw error;

            toast.success("Thanks for your vote!");
            fetchData();

        } catch (error: any) {
            console.error("Error upvoting:", error);
            toast.error("Failed to upvote");
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { bg: string; text: string; label: string }> = {
            submitted: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Submitted" },
            under_review: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Under Review" },
            in_progress: { bg: "bg-purple-500/20", text: "text-purple-400", label: "In Progress" },
            planned: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Planned" },
            completed: { bg: "bg-green-500/20", text: "text-green-400", label: "Completed" },
            declined: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Declined" }
        };

        const variant = variants[status] || variants.submitted;
        return (
            <Badge className={`${variant.bg} ${variant.text} border-0`}>
                {variant.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                    FEEDBACK <span className="text-tech-gold">&</span> SUGGESTIONS
                </h1>
                <p className="text-gray-400 font-medium">Help us improve by sharing your thoughts</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-black/40 border border-tech-gold/20 grid grid-cols-3">
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="feature-requests" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Feature Ideas
                    </TabsTrigger>
                    <TabsTrigger value="my-submissions" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        My Submissions
                    </TabsTrigger>
                </TabsList>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-6">
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-tech-gold" />
                                Share Your Feedback
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Tell us about your experience with our services
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-300 mb-2 block">How would you rate your experience?</Label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="transition-all hover:scale-110"
                                        >
                                            <Star
                                                className={cn(
                                                    "w-8 h-8",
                                                    star <= rating
                                                        ? "fill-tech-gold text-tech-gold"
                                                        : "text-gray-600 hover:text-gray-400"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-300">Category</Label>
                                <Select value={feedbackCategory} onValueChange={setFeedbackCategory}>
                                    <SelectTrigger className="bg-white/5 border-tech-gold/20 text-white mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Feedback</SelectItem>
                                        <SelectItem value="service_quality">Service Quality</SelectItem>
                                        <SelectItem value="communication">Communication</SelectItem>
                                        <SelectItem value="project_delivery">Project Delivery</SelectItem>
                                        <SelectItem value="support">Support</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-gray-300">Your Feedback</Label>
                                <Textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Tell us what you think... What did we do well? What could we improve?"
                                    rows={6}
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2 resize-none"
                                />
                            </div>

                            <Button
                                onClick={handleSubmitFeedback}
                                disabled={submittingFeedback || !feedbackText.trim() || rating === 0}
                                className="w-full bg-tech-gold hover:bg-white text-black font-bold h-12 rounded-xl"
                            >
                                {submittingFeedback ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Feedback
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Feature Requests Tab */}
                <TabsContent value="feature-requests" className="space-y-6">
                    {/* Submit Feature Request */}
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-tech-gold" />
                                Suggest a Feature
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Have an idea? We'd love to hear it!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-300">Feature Title</Label>
                                <Input
                                    value={featureTitle}
                                    onChange={(e) => setFeatureTitle(e.target.value)}
                                    placeholder="Brief title for your feature idea"
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Category</Label>
                                <Select value={featureCategory} onValueChange={setFeatureCategory}>
                                    <SelectTrigger className="bg-white/5 border-tech-gold/20 text-white mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="enhancement">Enhancement</SelectItem>
                                        <SelectItem value="new_feature">New Feature</SelectItem>
                                        <SelectItem value="integration">Integration</SelectItem>
                                        <SelectItem value="mobile">Mobile App</SelectItem>
                                        <SelectItem value="dashboard">Dashboard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-gray-300">Description</Label>
                                <Textarea
                                    value={featureDescription}
                                    onChange={(e) => setFeatureDescription(e.target.value)}
                                    placeholder="Describe your feature idea in detail. What problem would it solve? How would it work?"
                                    rows={6}
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2 resize-none"
                                />
                            </div>

                            <Button
                                onClick={handleSubmitFeatureRequest}
                                disabled={submittingFeature || !featureTitle.trim() || !featureDescription.trim()}
                                className="w-full bg-tech-gold hover:bg-white text-black font-bold h-12 rounded-xl"
                            >
                                {submittingFeature ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Lightbulb className="w-4 h-4 mr-2" />
                                        Submit Feature Request
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Popular Feature Requests */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-tech-gold" />
                            Popular Feature Requests
                        </h3>
                        <div className="space-y-3">
                            {featureRequests.slice(0, 5).map((feature, idx) => (
                                <motion.div
                                    key={feature.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-col h-auto py-2 px-3 border-tech-gold/20 hover:bg-tech-gold/10"
                                                    onClick={() => handleUpvote(feature.id, feature.upvotes)}
                                                >
                                                    <ThumbsUp className="w-4 h-4 text-tech-gold mb-1" />
                                                    <span className="text-xs font-bold">{feature.upvotes}</span>
                                                </Button>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-white font-bold">{feature.title}</h4>
                                                        {getStatusBadge(feature.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-400 line-clamp-2">{feature.description}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-[10px] border-tech-gold/20 text-gray-400">
                                                            {feature.category}
                                                        </Badge>
                                                        {feature.priority && (
                                                            <Badge variant="outline" className="text-[10px] border-tech-gold/20 text-tech-gold">
                                                                {feature.priority} priority
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* My Submissions Tab */}
                <TabsContent value="my-submissions" className="space-y-6">
                    {/* My Feedback */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">My Feedback</h3>
                        {myFeedback.length === 0 ? (
                            <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                                <CardContent className="p-8 text-center text-gray-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No feedback submitted yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {myFeedback.map((feedback, idx) => (
                                    <motion.div
                                        key={feedback.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={cn(
                                                                    "w-4 h-4",
                                                                    i < feedback.rating
                                                                        ? "fill-tech-gold text-tech-gold"
                                                                        : "text-gray-600"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                    {getStatusBadge(feedback.status)}
                                                </div>
                                                <p className="text-sm text-gray-300 mb-2">{feedback.feedback}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                                                    <Badge variant="outline" className="text-[10px] border-tech-gold/20">
                                                        {feedback.category}
                                                    </Badge>
                                                </div>
                                                {feedback.admin_response && (
                                                    <div className="mt-3 p-3 bg-tech-gold/10 border border-tech-gold/20 rounded-lg">
                                                        <p className="text-xs text-gray-400 mb-1">Admin Response:</p>
                                                        <p className="text-sm text-white">{feedback.admin_response}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Feature Requests */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">My Feature Requests</h3>
                        {myFeatureRequests.length === 0 ? (
                            <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                                <CardContent className="p-8 text-center text-gray-500">
                                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No feature requests submitted yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {myFeatureRequests.map((feature, idx) => (
                                    <motion.div
                                        key={feature.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="text-white font-bold flex items-center gap-2">
                                                        {feature.title}
                                                        <Badge variant="outline" className="text-[10px] font-normal">
                                                            {feature.upvotes} votes
                                                        </Badge>
                                                    </h4>
                                                    {getStatusBadge(feature.status)}
                                                </div>
                                                <p className="text-sm text-gray-400 mb-2">{feature.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{new Date(feature.created_at).toLocaleDateString()}</span>
                                                    <Badge variant="outline" className="text-[10px] border-tech-gold/20">
                                                        {feature.category}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FeedbackHub;
