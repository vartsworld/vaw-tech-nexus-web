import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Upload,
    Download,
    ExternalLink,
    X,
    Loader2,
    IndianRupee,
    Calendar,
    FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaymentCenterProps {
    profile: any;
}

const PaymentCenter = ({ profile }: PaymentCenterProps) => {
    const [paymentReminders, setPaymentReminders] = useState<any[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReminder, setSelectedReminder] = useState<any>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (profile) {
            fetchPaymentData();
        }
    }, [profile]);

    const fetchPaymentData = async () => {
        setLoading(true);
        try {
            // Fetch payment reminders
            const { data: reminders, error: remindersError } = await supabase
                .from("payment_reminders")
                .select("*")
                .eq("client_id", profile.id)
                .order("due_date", { ascending: true });

            if (remindersError) throw remindersError;
            setPaymentReminders(reminders || []);

            // Fetch payment history (we'll need to create this table or use documents)
            const { data: documents, error: docsError } = await supabase
                .from("client_documents")
                .select("*")
                .eq("client_id", profile.id)
                .eq("doc_type", "invoice")
                .order("created_at", { ascending: false });

            if (!docsError) {
                setPaymentHistory(documents || []);
            }
        } catch (error: any) {
            console.error("Error fetching payment data:", error);
            toast.error("Failed to load payment data");
        } finally {
            setLoading(false);
        }
    };

    const generateUPILink = (reminder: any) => {
        // UPI payment link format
        // upi://pay?pa=merchant@upi&pn=MerchantName&am=amount&cu=INR&tn=description
        const upiId = "vaw@paytm"; // Replace with your actual UPI ID
        const merchantName = "VAW Technologies";
        const amount = reminder.amount;
        const transactionNote = `Payment for ${reminder.title}`;

        return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    };

    const handlePayNow = (reminder: any) => {
        setSelectedReminder(reminder);
        const upiLink = generateUPILink(reminder);

        // Open UPI app
        window.location.href = upiLink;

        // Open payment confirmation dialog after a brief delay
        setTimeout(() => {
            setPaymentDialogOpen(true);
        }, 1000);
    };

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
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

    const handleSubmitPayment = async () => {
        if (!screenshot || !transactionId.trim()) {
            toast.error("Please upload screenshot and enter transaction ID");
            return;
        }

        if (!selectedReminder) return;

        setSubmitting(true);

        try {
            // Upload screenshot
            const fileExt = screenshot.name.split('.').pop();
            const fileName = `${profile.id}/payments/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-confirmations')
                .upload(fileName, screenshot);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('payment-confirmations')
                .getPublicUrl(fileName);

            // Create payment confirmation record (you may want to create a new table for this)
            const { error: insertError } = await supabase
                .from('client_documents')
                .insert({
                    client_id: profile.id,
                    title: `Payment Confirmation - ${selectedReminder.title}`,
                    file_url: urlData.publicUrl,
                    doc_type: 'payment_confirmation',
                    amount: selectedReminder.amount,
                    status: 'pending_verification',
                    // Store transaction ID in metadata or separate field
                });

            if (insertError) throw insertError;

            // Create notification for admin
            await supabase
                .from('client_notifications')
                .insert({
                    client_id: null, // For admin
                    title: 'Payment Confirmation Received',
                    message: `${profile.company_name} submitted payment confirmation for ${selectedReminder.title}. Transaction ID: ${transactionId}`,
                    type: 'payment_confirmation',
                    category: 'payment',
                    priority: 'high',
                    read: false
                });

            toast.success("Payment confirmation submitted! We'll verify it shortly.");

            // Reset form
            setScreenshot(null);
            setScreenshotPreview("");
            setTransactionId("");
            setPaymentDialogOpen(false);
            setSelectedReminder(null);

            // Refresh data
            fetchPaymentData();

        } catch (error: any) {
            console.error("Error submitting payment:", error);
            toast.error(error.message || "Failed to submit payment confirmation");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string, dueDate?: string) => {
        if (status === 'paid') {
            return <Badge className="bg-green-500/20 text-green-400 border-0">Paid</Badge>;
        }

        if (dueDate) {
            const due = new Date(dueDate);
            const today = new Date();
            const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntil < 0) {
                return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
            } else if (daysUntil === 0) {
                return <Badge className="bg-orange-500/20 text-orange-400 border-0">Due Today</Badge>;
            } else if (daysUntil <= 3) {
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Due Soon</Badge>;
            }
        }

        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Pending</Badge>;
    };

    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-tech-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                    PAYMENT <span className="text-tech-gold">CENTER</span>
                </h1>
                <p className="text-gray-400 font-medium">Manage your payments and invoices</p>
            </div>

            <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="bg-black/40 border border-tech-gold/20">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        Pending Payments
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        Payment History
                    </TabsTrigger>
                </TabsList>

                {/* Pending Payments Tab */}
                <TabsContent value="pending" className="space-y-4">
                    {paymentReminders.filter(r => r.status !== 'paid').length === 0 ? (
                        <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-20" />
                                <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                                <p className="text-gray-400">You have no pending payments</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {paymentReminders
                                .filter(r => r.status !== 'paid')
                                .map((reminder, idx) => {
                                    const daysUntil = getDaysUntilDue(reminder.due_date);
                                    const isOverdue = daysUntil < 0;

                                    return (
                                        <motion.div
                                            key={reminder.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <Card className={cn(
                                                "bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all overflow-hidden",
                                                isOverdue && "border-red-500/50 bg-red-500/5"
                                            )}>
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-white mb-1">
                                                                        {reminder.title}
                                                                    </h3>
                                                                    {reminder.notes && (
                                                                        <p className="text-sm text-gray-400">{reminder.notes}</p>
                                                                    )}
                                                                </div>
                                                                {getStatusBadge(reminder.status, reminder.due_date)}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                    <IndianRupee className="w-4 h-4 text-tech-gold" />
                                                                    <span className="text-2xl font-black text-tech-gold">
                                                                        {Number(reminder.amount).toLocaleString('en-IN')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>
                                                                        Due: {new Date(reminder.due_date).toLocaleDateString('en-IN')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {isOverdue && (
                                                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                                    <p className="text-xs text-red-400 flex items-center gap-2">
                                                                        <AlertCircle className="w-4 h-4" />
                                                                        This payment is {Math.abs(daysUntil)} days overdue
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                onClick={() => handlePayNow(reminder)}
                                                                className="bg-tech-gold hover:bg-white text-black font-bold h-12 px-6 rounded-xl transition-all shadow-lg shadow-tech-gold/20"
                                                            >
                                                                <IndianRupee className="w-4 h-4 mr-2" />
                                                                Pay Now via UPI
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="border-tech-gold/20 hover:bg-tech-gold/10 text-white font-bold"
                                                                onClick={() => {
                                                                    setSelectedReminder(reminder);
                                                                    setPaymentDialogOpen(true);
                                                                }}
                                                            >
                                                                Submit Confirmation
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    )}
                </TabsContent>

                {/* Payment History Tab */}
                <TabsContent value="history" className="space-y-4">
                    {paymentHistory.length === 0 ? (
                        <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-20" />
                                <p className="text-gray-400">No payment history available</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {paymentHistory.map((doc, idx) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-tech-gold/10 rounded-xl">
                                                        <FileText className="w-5 h-5 text-tech-gold" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold">{doc.title}</h4>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(doc.created_at).toLocaleDateString('en-IN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {doc.amount && (
                                                        <p className="text-tech-gold font-bold">
                                                            ₹{Number(doc.amount).toLocaleString('en-IN')}
                                                        </p>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-tech-gold hover:bg-tech-gold/10"
                                                        onClick={() => window.open(doc.file_url, '_blank')}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Payment Confirmation Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="bg-black border-tech-gold/20 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Submit Payment Confirmation</DialogTitle>
                    </DialogHeader>

                    {selectedReminder && (
                        <div className="space-y-4">
                            <div className="p-4 bg-tech-gold/10 border border-tech-gold/20 rounded-xl">
                                <p className="text-sm text-gray-400 mb-1">Payment for:</p>
                                <p className="text-white font-bold">{selectedReminder.title}</p>
                                <p className="text-2xl font-black text-tech-gold mt-2">
                                    ₹{Number(selectedReminder.amount).toLocaleString('en-IN')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-gray-300">Transaction ID *</Label>
                                <Input
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter UPI transaction ID"
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Payment Screenshot *</Label>
                                {screenshotPreview ? (
                                    <div className="relative mt-2">
                                        <img
                                            src={screenshotPreview}
                                            alt="Payment screenshot"
                                            className="w-full h-48 object-cover rounded-xl border border-tech-gold/20"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 bg-black/80 hover:bg-red-500/20"
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
                                        <span className="text-sm text-gray-400">Upload payment screenshot</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleScreenshotChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-tech-gold/20"
                                    onClick={() => setPaymentDialogOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitPayment}
                                    disabled={submitting || !screenshot || !transactionId.trim()}
                                    className="flex-1 bg-tech-gold hover:bg-white text-black font-bold"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Confirmation"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentCenter;
