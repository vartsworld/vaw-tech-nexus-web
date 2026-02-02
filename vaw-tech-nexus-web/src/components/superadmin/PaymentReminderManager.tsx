import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    Calendar,
    IndianRupee,
    Edit,
    Trash2,
    Send,
    Loader2,
    Clock,
    AlertCircle,
    CheckCircle2,
    Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PaymentReminderManager = () => {
    const [reminders, setReminders] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form state
    const [selectedClient, setSelectedClient] = useState("");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all clients
            const { data: clientsData } = await supabase
                .from("client_profiles")
                .select("id, company_name, email")
                .order("company_name");

            setClients(clientsData || []);

            // Fetch all payment reminders with client info
            const { data: remindersData } = await supabase
                .from("payment_reminders")
                .select(`
                    *,
                    client_profiles!inner(id, company_name, email)
                `)
                .order("due_date", { ascending: true });

            setReminders(remindersData || []);

        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (reminder?: any) => {
        if (reminder) {
            setEditingReminder(reminder);
            setSelectedClient(reminder.client_id);
            setTitle(reminder.title);
            setAmount(reminder.amount.toString());
            setDueDate(reminder.due_date);
            setNotes(reminder.notes || "");
        } else {
            setEditingReminder(null);
            resetForm();
        }
        setDialogOpen(true);
    };

    const resetForm = () => {
        setSelectedClient("");
        setTitle("");
        setAmount("");
        setDueDate("");
        setNotes("");
    };

    const handleSubmit = async () => {
        if (!selectedClient || !title.trim() || !amount || !dueDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);

        try {
            const reminderData = {
                client_id: selectedClient,
                title: title.trim(),
                amount: parseFloat(amount),
                due_date: dueDate,
                notes: notes.trim() || null,
                status: "pending"
            };

            if (editingReminder) {
                // Update existing reminder
                const { error } = await supabase
                    .from("payment_reminders")
                    .update(reminderData)
                    .eq("id", editingReminder.id);

                if (error) throw error;
                toast.success("Payment reminder updated successfully");
            } else {
                // Create new reminder
                const { error } = await supabase
                    .from("payment_reminders")
                    .insert(reminderData);

                if (error) throw error;
                toast.success("Payment reminder created successfully");
            }

            setDialogOpen(false);
            resetForm();
            fetchData();

        } catch (error: any) {
            console.error("Error saving reminder:", error);
            toast.error(error.message || "Failed to save reminder");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment reminder?")) return;

        try {
            const { error } = await supabase
                .from("payment_reminders")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Payment reminder deleted");
            fetchData();

        } catch (error: any) {
            console.error("Error deleting reminder:", error);
            toast.error("Failed to delete reminder");
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            const { error } = await supabase
                .from("payment_reminders")
                .update({ status: "paid" })
                .eq("id", id);

            if (error) throw error;

            toast.success("Marked as paid");
            fetchData();

        } catch (error: any) {
            console.error("Error updating reminder:", error);
            toast.error("Failed to update reminder");
        }
    };

    const handleSendManualReminder = async (reminder: any) => {
        try {
            // Create notification for client
            const { error } = await supabase
                .from("client_notifications")
                .insert({
                    client_id: reminder.client_id,
                    title: `Payment Reminder: ${reminder.title}`,
                    message: `This is a reminder that payment of ₹${reminder.amount} is due on ${new Date(reminder.due_date).toLocaleDateString()}`,
                    type: "payment_reminder",
                    category: "payment",
                    priority: "high",
                    read: false
                });

            if (error) throw error;

            toast.success("Reminder sent to client");

        } catch (error: any) {
            console.error("Error sending reminder:", error);
            toast.error("Failed to send reminder");
        }
    };

    const getStatusBadge = (status: string, dueDate?: string) => {
        if (status === "paid") {
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
            }
        }

        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Pending</Badge>;
    };

    const filteredReminders = reminders.filter(r =>
        r.client_profiles.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Payment Reminders</h2>
                    <p className="text-gray-400 text-sm mt-1">Manage client payment reminders and notifications</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-tech-gold hover:bg-white text-black font-bold"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Reminder
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-tech-gold/20 text-white max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                {editingReminder ? "Edit Payment Reminder" : "Create Payment Reminder"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div>
                                <Label className="text-gray-300">Client *</Label>
                                <Select value={selectedClient} onValueChange={setSelectedClient}>
                                    <SelectTrigger className="bg-white/5 border-tech-gold/20 text-white mt-2">
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-gray-300">Title *</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Website Development - Final Payment"
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-300">Amount (₹) *</Label>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="50000"
                                        className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300">Due Date *</Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="bg-white/5 border-tech-gold/20 text-white mt-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-300">Notes (Optional)</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Additional notes or payment instructions"
                                    rows={3}
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2 resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-tech-gold/20"
                                    onClick={() => setDialogOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 bg-tech-gold hover:bg-white text-black font-bold"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingReminder ? "Update Reminder" : "Create Reminder"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by client or title..."
                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 pl-10"
                />
            </div>

            {/* Reminders List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-tech-gold" />
                </div>
            ) : filteredReminders.length === 0 ? (
                <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                    <CardContent className="p-12 text-center">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-20" />
                        <p className="text-gray-400">No payment reminders found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredReminders.map((reminder, idx) => (
                        <motion.div
                            key={reminder.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{reminder.title}</h3>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {reminder.client_profiles.company_name}
                                                    </p>
                                                </div>
                                                {getStatusBadge(reminder.status, reminder.due_date)}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <IndianRupee className="w-4 h-4 text-tech-gold" />
                                                    <span className="text-tech-gold font-bold">
                                                        ₹{Number(reminder.amount).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        Due: {new Date(reminder.due_date).toLocaleDateString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>

                                            {reminder.notes && (
                                                <p className="text-xs text-gray-500 mt-2 italic">{reminder.notes}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {reminder.status !== "paid" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500/30 hover:bg-green-500/10 text-green-400"
                                                        onClick={() => handleMarkAsPaid(reminder.id)}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Mark Paid
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-tech-gold/20 hover:bg-tech-gold/10 text-tech-gold"
                                                        onClick={() => handleSendManualReminder(reminder)}
                                                    >
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Send Now
                                                    </Button>
                                                </>
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-blue-400 hover:bg-blue-500/10"
                                                    onClick={() => handleOpenDialog(reminder)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(reminder.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaymentReminderManager;
