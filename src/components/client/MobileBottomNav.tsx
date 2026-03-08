import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Home,
    LayoutDashboard,
    Briefcase,
    CreditCard,
    MessageSquare,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { icon: Home, label: "Home", path: "/client/dashboard", exact: true },
        { icon: Briefcase, label: "Projects", path: "/client/dashboard/projects" },
        { icon: CreditCard, label: "Payments", path: "/client/dashboard/financials" },
        { icon: MessageSquare, label: "Support", path: "/client/dashboard/support" },
        { icon: User, label: "Profile", path: "/client/dashboard/settings" }
    ];

    const isActive = (path: string, exact?: boolean) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <>
            <div className="h-24" />

            <nav className="fixed bottom-3 left-3 right-3 z-40">
                <div className="bg-card/70 backdrop-blur-2xl border border-border/30 rounded-[1.75rem] overflow-hidden">
                    <div className="flex items-center justify-around px-1 py-2 safe-area-inset-bottom">
                        {navItems.map((item) => {
                            const active = isActive(item.path, item.exact);
                            const Icon = item.icon;
                            const isLogo = item.label === "Home";

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="relative flex flex-col items-center gap-0.5 py-1 px-1.5 min-w-[48px] group"
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="navGlow"
                                            className="absolute -top-1 w-8 h-8 rounded-full bg-primary/12 blur-xl"
                                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                        />
                                    )}

                                    <motion.div
                                        animate={active ? { y: -3 } : { y: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={cn(
                                            "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
                                            active
                                                ? "bg-primary/12"
                                                : "group-hover:bg-muted/50"
                                        )}
                                    >
                                        {isLogo && active ? (
                                            <img
                                                src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                                                alt="VAW"
                                                className="w-5 h-5 rounded-md object-cover"
                                            />
                                        ) : (
                                            <Icon
                                                className={cn(
                                                    "w-[17px] h-[17px] transition-all duration-300",
                                                    active
                                                        ? "text-primary drop-shadow-[0_0_6px_hsl(43_100%_50%/0.4)]"
                                                        : "text-muted-foreground group-hover:text-foreground"
                                                )}
                                                strokeWidth={active ? 2.2 : 1.8}
                                            />
                                        )}

                                        {active && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_hsl(43_100%_50%/0.5)]"
                                            />
                                        )}
                                    </motion.div>

                                    <motion.span
                                        animate={active ? { opacity: 1 } : { opacity: 0.4 }}
                                        className={cn(
                                            "text-[8px] font-semibold tracking-[0.06em] uppercase transition-colors duration-300",
                                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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

export default BottomNav;
