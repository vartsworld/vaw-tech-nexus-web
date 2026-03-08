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
        { icon: LayoutDashboard, label: "Overview", path: "/client/dashboard", exact: true },
        { icon: Briefcase, label: "Projects", path: "/client/dashboard/projects" },
        { icon: CreditCard, label: "Payments", path: "/client/dashboard/financials" },
        { icon: MessageSquare, label: "Support", path: "/client/dashboard/support" },
        { icon: Settings, label: "Settings", path: "/client/dashboard/settings" }
    ];

    const isActive = (path: string, exact?: boolean) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <>
            <div className="h-24 lg:hidden" />

            <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
                {/* Gradient fade edge */}
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

                <div className="bg-card/90 backdrop-blur-2xl border-t border-border shadow-neu">
                    <div className="flex items-end justify-around px-3 pt-2 pb-1 safe-area-inset-bottom">
                        {navItems.map((item) => {
                            const active = isActive(item.path, item.exact);
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="relative flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[56px] group"
                                >
                                    {/* Glow behind active icon */}
                                    {active && (
                                        <motion.div
                                            layoutId="navGlow"
                                            className="absolute -top-1 w-10 h-10 rounded-full bg-primary/15 blur-xl"
                                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                        />
                                    )}

                                    {/* Icon container */}
                                    <motion.div
                                        animate={active ? { y: -4 } : { y: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={cn(
                                            "relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300",
                                            active
                                                ? "bg-primary/15 shadow-neu-sm"
                                                : "group-hover:bg-muted"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "w-[18px] h-[18px] transition-all duration-300",
                                                active
                                                    ? "text-primary drop-shadow-[0_0_6px_hsl(43_100%_50%/0.4)]"
                                                    : "text-muted-foreground group-hover:text-foreground"
                                            )}
                                            strokeWidth={active ? 2.2 : 1.8}
                                        />

                                        {/* Active pip */}
                                        {active && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_hsl(43_100%_50%/0.6)]"
                                            />
                                        )}
                                    </motion.div>

                                    {/* Label */}
                                    <motion.span
                                        animate={active ? { opacity: 1 } : { opacity: 0.45 }}
                                        className={cn(
                                            "text-[9px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300",
                                            active ? "text-tech-gold" : "text-gray-600 group-hover:text-gray-500"
                                        )}
                                    >
                                        {item.label}
                                    </motion.span>
                                </button>
                            );
                        })}
                    </div>
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
