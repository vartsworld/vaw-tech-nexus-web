import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Briefcase,
    CreditCard,
    MessageSquare,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        {
            icon: LayoutDashboard,
            label: "Overview",
            path: "/client/dashboard",
            exact: true
        },
        {
            icon: Briefcase,
            label: "Projects",
            path: "/client/dashboard/projects"
        },
        {
            icon: CreditCard,
            label: "Payments",
            path: "/client/dashboard/financials"
        },
        {
            icon: MessageSquare,
            label: "Support",
            path: "/client/dashboard/support"
        },
        {
            icon: Settings,
            label: "Settings",
            path: "/client/dashboard/settings"
        }
    ];

    const isActive = (path: string, exact?: boolean) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="h-20 md:hidden" />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-black/95 backdrop-blur-xl border-t border-tech-gold/20">
                <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
                    {navItems.map((item) => {
                        const active = isActive(item.path, item.exact);
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[60px]",
                                    active
                                        ? "text-tech-gold"
                                        : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                {/* Active Indicator */}
                                {active && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-tech-gold/10 rounded-xl border border-tech-gold/20"
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30
                                        }}
                                    />
                                )}

                                {/* Icon */}
                                <div className="relative">
                                    <Icon
                                        className={cn(
                                            "w-5 h-5 transition-all",
                                            active && "scale-110"
                                        )}
                                    />

                                    {/* Active Dot */}
                                    {active && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 w-2 h-2 bg-tech-gold rounded-full"
                                        />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider transition-all",
                                        active ? "text-tech-gold" : "text-gray-500"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            <style>{`
                .safe-area-inset-bottom {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
        </>
    );
};

export default MobileBottomNav;
