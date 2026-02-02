import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Upload, X, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ErrorLoggerProps {
    clientId: string;
}

const ErrorLogger = ({ clientId }: ErrorLoggerProps) => {
    const [errorType, setErrorType] = useState("technical");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [previousErrors, setPreviousErrors] = useState<any[]>([]);
    const [loadingPrevious, setLoadingPrevious] = useState(false);

    const errorTypes = [
        { value: "technical", label: "Technical Issue" },
        { value: "access", label: "Access Problem" },
        { value: "ui_ux", label: "UI/UX Issue" },
        { value: "performance", label: "Performance Issue" },
        { value: "feature", label: "Feature Not Working" },
        { value: "other", label: "Other" }
    ];

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Screenshot must be less than 5MB");
                return;
            }
            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);

        try {
            let screenshotUrl = null;

            // Upload screenshot if provided
            if (screenshot) {
                const fileExt = screenshot.name.split('.').pop();
                const fileName = `${clientId}/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('client-error-screenshots')
                    .upload(fileName, screenshot);

                if (uploadError) {
                    console.error("Screenshot upload error:", uploadError);
                    toast.error("Failed to upload screenshot");
                } else {
                    const { data: urlData } = supabase.storage
                        .from('client-error-screenshots')
                        .getPublicUrl(fileName);
                    screenshotUrl = urlData.publicUrl;
                }
            }

            // Insert error log
            const { error: insertError } = await supabase
                .from('client_error_logs')
                .insert({
                    client_id: clientId,
                    error_type: errorType,
                    title: title.trim(),
                    description: description.trim(),
                    screenshot_url: screenshotUrl,
                    page_url: window.location.href,
                    browser_info: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language
                    },
                    status: 'open',
                    priority: 'medium'
                });

            if (insertError) {
                throw new Error(insertError.message);
            }

            toast.success("Error reported successfully! Our team will review it soon.");

            // Reset form
            setTitle("");
            setDescription("");
            setScreenshot(null);
            setScreenshotPreview("");
            setErrorType("technical");

            // Refresh previous errors
            fetchPreviousErrors();

        } catch (error: any) {
            console.error("Error submitting log:", error);
            toast.error(error.message || "Failed to submit error log");
        } finally {
            setSubmitting(false);
        }
    };

    const fetchPreviousErrors = async () => {
        setLoadingPrevious(true);
        try {
            const { data, error } = await supabase
                .from('client_error_logs')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setPreviousErrors(data || []);
        } catch (error) {
            console.error("Error fetching previous logs:", error);
        } finally {
            setLoadingPrevious(false);
        }
    };

    useState(() => {
        fetchPreviousErrors();
    }, [clientId]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { bg: string; text: string; label: string }> = {
            open: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Open" },
            in_progress: { bg: "bg-blue-500/20", text: "text-blue-400", label: "In Progress" },
            resolved: { bg: "bg-green-500/20", text: "text-green-400", label: "Resolved" },
            closed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Closed" }
        };

        const variant = variants[status] || variants.open;
        return (
            <Badge className={`${variant.bg} ${variant.text} border-0`}>
                {variant.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Report Form */}
            <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Report an Issue
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Help us improve by reporting any issues you encounter
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="error-type" className="text-gray-300">Issue Type</Label>
                        <Select value={errorType} onValueChange={setErrorType}>
                            <SelectTrigger className="bg-white/5 border-tech-gold/20 text-white mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {errorTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="title" className="text-gray-300">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Brief description of the issue"
                            className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description" className="text-gray-300">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please provide details about what happened, what you expected, and any steps to reproduce the issue"
                            rows={5}
                            className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2 resize-none"
                        />
                    </div>

                    <div>
                        <Label className="text-gray-300">Screenshot (Optional)</Label>
                        {screenshotPreview ? (
                            <div className="relative mt-2">
                                <img
                                    src={screenshotPreview}
                                    alt="Screenshot preview"
                                    className="w-full h-48 object-cover rounded-xl border border-tech-gold/20"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 bg-black/80 hover:bg-red-500/20 text-white"
                                    onClick={() => {
                                        setScreenshot(null);
                                        setScreenshotPreview("");
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <label className="mt-2 flex flex-col items-center justify-center h-32 border-2 border-dashed border-tech-gold/20 rounded-xl cursor-pointer hover:border-tech-gold/40 transition-colors">
                                <Upload className="w-8 h-8 text-tech-gold mb-2" />
                                <span className="text-sm text-gray-400">Click to upload screenshot</span>
                                <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleScreenshotChange}
                                />
                            </label>
                        )}
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-xl"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Error Report"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Previous Reports */}
            <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                <CardHeader>
                    <CardTitle className="text-white text-lg">Your Previous Reports</CardTitle>
                    <CardDescription className="text-gray-400">
                        Track the status of your reported issues
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingPrevious ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-tech-gold" />
                        </div>
                    ) : previousErrors.length > 0 ? (
                        <div className="space-y-3">
                            {previousErrors.map((error, idx) => (
                                <motion.div
                                    key={error.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-tech-gold/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold text-sm">{error.title}</h4>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{error.description}</p>
                                        </div>
                                        {getStatusBadge(error.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(error.created_at).toLocaleDateString()}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] border-tech-gold/20 text-gray-400">
                                            {error.error_type.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    {error.resolution_notes && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-green-400 flex items-start gap-2">
                                                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                <span>{error.resolution_notes}</span>
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No previous reports</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ErrorLogger;
