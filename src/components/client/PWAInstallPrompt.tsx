import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const iOS = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);

        setIsIOS(iOS);
        setIsAndroid(android);

        // Listen for the beforeinstallprompt event (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after user has been on site for 30 seconds
            // and hasn't dismissed it before
            const dismissed = localStorage.getItem('pwa-prompt-dismissed');
            if (!dismissed) {
                setTimeout(() => {
                    setShowPrompt(true);
                }, 30000); // 30 seconds
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show instructions if not already dismissed
        if (iOS && !localStorage.getItem('pwa-prompt-dismissed-ios')) {
            setTimeout(() => {
                setShowPrompt(true);
            }, 30000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setShowPrompt(false);
            setDeferredPrompt(null);
        } else {
            console.log('User dismissed the install prompt');
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        if (isIOS) {
            localStorage.setItem('pwa-prompt-dismissed-ios', 'true');
        } else {
            localStorage.setItem('pwa-prompt-dismissed', 'true');
        }
    };

    // Don't show if already installed
    if (isInstalled || !showPrompt) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
                >
                    <Card className="bg-gradient-to-br from-tech-gold/20 to-tech-red/20 border-tech-gold/30 backdrop-blur-xl shadow-2xl shadow-tech-gold/10">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-tech-gold/20 rounded-lg">
                                    <Download className="w-6 h-6 text-tech-gold" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold mb-1">
                                        Install VAW Dashboard
                                    </h3>

                                    {isIOS ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-300">
                                                Install this app on your iPhone for quick access and offline support:
                                            </p>
                                            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                                                <li>Tap the <Share className="w-3 h-3 inline mx-1" /> Share button below</li>
                                                <li>Scroll and tap "Add to Home Screen"</li>
                                                <li>Tap "Add" in the top right</li>
                                            </ol>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-300 mb-3">
                                            Install the app for quick access, offline support, and a better experience!
                                        </p>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        {!isIOS && deferredPrompt && (
                                            <Button
                                                onClick={handleInstallClick}
                                                size="sm"
                                                className="bg-tech-gold hover:bg-white text-black font-bold"
                                            >
                                                Install Now
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleDismiss}
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-300 hover:text-white hover:bg-white/10"
                                        >
                                            Maybe Later
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleDismiss}
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
