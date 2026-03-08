import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BrowserNotificationPrompt = () => {
    const [show, setShow] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if (!("Notification" in window)) return;

        const currentPerm = Notification.permission;
        setPermission(currentPerm);

        if (currentPerm === "default") {
            const dismissed = localStorage.getItem("client_notif_prompt_dismissed");
            if (!dismissed) {
                const timer = setTimeout(() => setShow(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleEnable = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === "granted") {
                new Notification("Notifications Enabled ✓", {
                    body: "You'll now receive payment reminders and important updates.",
                    icon: "/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                });
            }
        } catch (e) {
            console.error("Notification permission error:", e);
        }
        setShow(false);
    };

    const handleDismiss = () => {
        localStorage.setItem("client_notif_prompt_dismissed", Date.now().toString());
        setShow(false);
    };

    if (permission === "granted") return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
                >
                    <div className="neu-elevated rounded-2xl p-5 border border-primary/20 backdrop-blur-2xl shadow-2xl">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <Bell className="w-6 h-6 text-primary animate-bounce" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-foreground mb-1">Stay Updated</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                    Enable notifications to receive payment reminders, project updates, and important alerts in real-time.
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        onClick={handleEnable}
                                        className="bg-primary text-primary-foreground font-bold text-xs h-8 px-4 rounded-lg"
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                                        Enable Notifications
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDismiss}
                                        className="text-xs text-muted-foreground h-8"
                                    >
                                        Not now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BrowserNotificationPrompt;
