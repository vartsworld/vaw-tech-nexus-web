import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    X,
    Info,
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    is_read: boolean;
    created_at: string;
    link_url?: string;
}

interface ClientNotificationCenterProps {
    clientId: string;
}

const ClientNotificationCenter = ({ clientId }: ClientNotificationCenterProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (clientId) {
            fetchNotifications();

            // Subscribe to new notifications
            const channel = supabase
                .channel('client_notifications_updates')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'client_notifications',
                        filter: `client_id=eq.${clientId}`
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification;
                        setNotifications(prev => [newNotif, ...prev]);
                        toast.info(`New Notification: ${newNotif.title}`);

                        // Play sound or browser notification if enabled
                        if (Notification.permission === 'granted') {
                            new Notification(newNotif.title, { body: newNotif.message });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [clientId]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('client_notifications')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error("Error fetching client notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('client_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('client_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('client_id', clientId)
                .eq('is_read', false);

            if (error) throw error;
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from('client_notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const getIcon = (type: string, priority: string) => {
        if (priority === 'urgent') return <Zap className="w-4 h-4 text-tech-red animate-pulse" />;
        switch (type) {
            case 'announcement': return <Info className="w-4 h-4 text-blue-500" />;
            case 'update': return <Clock className="w-4 h-4 text-tech-gold" />;
            case 'billing': return <CreditCard className="w-4 h-4 text-green-500" />;
            case 'alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Bell className="w-4 h-4 text-tech-gold" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-gray-400 hover:text-white group"
            >
                <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-tech-red rounded-full border-2 border-black animate-pulse" />
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-[350px] md:w-[400px] bg-[#0A0A0A] border border-tech-gold/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-tech-gold/10 flex items-center justify-between bg-tech-gold/5">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-tech-gold" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                            {unreadCount} NEW
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={markAllAsRead}
                                            className="text-[10px] text-tech-gold hover:text-white h-7 hover:bg-tech-gold/10"
                                        >
                                            Mark all read
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}
                                        className="h-7 w-7 text-gray-500 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-[450px] overflow-y-auto p-2 custom-scrollbar">
                                {loading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-2 border-tech-gold/20 border-t-tech-gold rounded-full animate-spin" />
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Synchronizing...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <Bell className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-gray-400">Your signal feed is empty</p>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">No pending transmissions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {notifications.map((n) => (
                                            <motion.div
                                                key={n.id}
                                                layout
                                                className={cn(
                                                    "p-3 rounded-xl transition-all border border-transparent hover:border-tech-gold/20 group relative",
                                                    !n.is_read ? "bg-tech-gold/5" : "bg-transparent opacity-70 hover:opacity-100"
                                                )}
                                                onClick={() => !n.is_read && markAsRead(n.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                        !n.is_read ? "bg-tech-gold/10 border-tech-gold/20" : "bg-white/5 border-white/5"
                                                    )}>
                                                        {getIcon(n.type, n.priority)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <h4 className={cn(
                                                                "text-sm font-bold truncate pr-6",
                                                                !n.is_read ? "text-white" : "text-gray-400"
                                                            )}>
                                                                {n.title}
                                                            </h4>
                                                            <span className="text-[9px] text-gray-600 font-medium shrink-0">
                                                                {format(new Date(n.created_at), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                                                {format(new Date(n.created_at), 'MMM dd, yyyy')}
                                                            </p>
                                                            {!n.is_read && (
                                                                <Badge variant="outline" className="text-[8px] h-4 border-tech-gold/20 text-tech-gold bg-tech-gold/5">
                                                                    NEW
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(n.id);
                                                    }}
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-tech-red"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-tech-gold/10 bg-black/50 text-center">
                                <Button
                                    variant="ghost"
                                    className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-600 hover:text-tech-gold w-full py-0 h-6"
                                    onClick={() => toast.info("Full notification archive coming soon.")}
                                >
                                    View Full Archive
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// Internal icon helper
const CreditCard = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
);

export default ClientNotificationCenter;
