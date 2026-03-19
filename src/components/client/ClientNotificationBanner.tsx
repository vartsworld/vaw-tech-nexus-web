import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CreditCard, X, ArrowRight, Clock, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

interface NotificationAlert {
    id: string;
    type: 'payment_due' | 'project_update' | 'announcement' | 'support';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    actionLabel?: string;
    daysUntilDue?: number;
}

interface ClientNotificationBannerProps {
    clientId: string;
    billingSyncId?: string;
}

const ClientNotificationBanner = ({ clientId, billingSyncId }: ClientNotificationBannerProps) => {
    const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const fetchAlerts = useCallback(async () => {
        const allAlerts: NotificationAlert[] = [];

        // 1. Fetch payment due alerts from client_projects
        try {
            const { data: projects } = await supabase
                .from('client_projects')
                .select('*')
                .eq('client_id', clientId)
                .in('status', ['active', 'in_progress', 'pending']);

            if (projects) {
                for (const proj of projects) {
                    if (proj.next_payment_date) {
                        const daysUntil = differenceInDays(new Date(proj.next_payment_date), new Date());
                        if (daysUntil <= 14) {
                            const amount = proj.total_amount ? (proj.total_amount - (proj.amount_paid || 0)) : 0;
                            if (amount > 0) {
                                allAlerts.push({
                                    id: `payment-${proj.id}`,
                                    type: 'payment_due',
                                    title: daysUntil < 0 ? 'Payment Overdue' : 'Payment Due Soon',
                                    message: daysUntil < 0
                                        ? `Your payment of R${amount.toLocaleString()} for "${proj.title}" was due ${Math.abs(daysUntil)} days ago`
                                        : daysUntil === 0
                                            ? `Your payment of R${amount.toLocaleString()} for "${proj.title}" is due today!`
                                            : `Your payment of R${amount.toLocaleString()} for "${proj.title}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
                                    priority: daysUntil < 0 ? 'urgent' : daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
                                    daysUntilDue: daysUntil,
                                    actionUrl: '/client/dashboard/financials',
                                    actionLabel: 'View & Pay'
                                });
                            }
                        }
                    }

                    // Renewal alerts
                    if (proj.renewal_date) {
                        const daysUntilRenewal = differenceInDays(new Date(proj.renewal_date), new Date());
                        if (daysUntilRenewal >= 0 && daysUntilRenewal <= 14) {
                            allAlerts.push({
                                id: `renewal-${proj.id}`,
                                type: 'payment_due',
                                title: 'Service Renewal Approaching',
                                message: `Your "${proj.title}" service renews in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}`,
                                priority: daysUntilRenewal <= 3 ? 'high' : 'medium',
                                daysUntilDue: daysUntilRenewal,
                                actionUrl: '/client/dashboard/financials',
                                actionLabel: 'View Details'
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching project alerts:", e);
        }

        // 2. Fetch unread notifications from client_notifications
        try {
            const { data: notifs } = await supabase
                .from('client_notifications')
                .select('*')
                .eq('client_id', clientId)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (notifs) {
                for (const n of notifs) {
                    allAlerts.push({
                        id: `notif-${n.id}`,
                        type: n.type === 'billing' ? 'payment_due' : n.type === 'update' ? 'project_update' : 'announcement',
                        title: n.title,
                        message: n.message,
                        priority: (n.priority as any) || 'medium',
                        actionUrl: n.link_url || n.action_url || undefined,
                        actionLabel: 'View'
                    });
                }
            }
        } catch (e) {
            console.error("Error fetching notifications:", e);
        }

        // Sort by priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        allAlerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        setAlerts(allAlerts);

        // Send browser notification for urgent/high items
        if ("Notification" in window && Notification.permission === "granted") {
            const urgent = allAlerts.filter(a => a.priority === 'urgent' || a.priority === 'high');
            const lastNotified = localStorage.getItem('client_last_browser_notif');
            const now = Date.now();
            // Only notify once every 4 hours
            if (!lastNotified || now - parseInt(lastNotified) > 4 * 60 * 60 * 1000) {
                if (urgent.length > 0) {
                    new Notification(urgent[0].title, {
                        body: urgent[0].message,
                        icon: "/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                    });
                    localStorage.setItem('client_last_browser_notif', now.toString());
                }
            }
        }
    }, [clientId, billingSyncId]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

    if (visibleAlerts.length === 0) return null;

    const getStyle = (priority: string) => {
        switch (priority) {
            case 'urgent': return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive', icon: <Zap className="w-4 h-4 animate-pulse" /> };
            case 'high': return { bg: 'bg-destructive/8', border: 'border-destructive/20', text: 'text-destructive', icon: <AlertCircle className="w-4 h-4" /> };
            case 'medium': return { bg: 'bg-primary/8', border: 'border-primary/20', text: 'text-primary', icon: <Clock className="w-4 h-4" /> };
            default: return { bg: 'bg-accent/50', border: 'border-border', text: 'text-muted-foreground', icon: <Bell className="w-4 h-4" /> };
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'payment_due': return <CreditCard className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-2 mb-6">
            <AnimatePresence>
                {visibleAlerts.slice(0, 4).map((alert, i) => {
                    const style = getStyle(alert.priority);
                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 100, height: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "rounded-xl border p-4 flex items-center gap-4 relative group",
                                style.bg, style.border
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", style.bg, style.border)}>
                                <span className={style.text}>{getTypeIcon(alert.type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={cn("text-sm font-bold", style.text)}>{alert.title}</span>
                                    {alert.priority === 'urgent' && (
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded animate-pulse">
                                            URGENT
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {alert.actionUrl && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={cn("text-xs font-bold h-8 gap-1", style.text)}
                                        onClick={() => window.location.href = alert.actionUrl!}
                                    >
                                        {alert.actionLabel || 'View'}
                                        <ArrowRight className="w-3 h-3" />
                                    </Button>
                                )}
                                <button
                                    onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            {visibleAlerts.length > 4 && (
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold">
                    +{visibleAlerts.length - 4} more notifications
                </p>
            )}
        </div>
    );
};

export default ClientNotificationBanner;
