import { motion, AnimatePresence } from "framer-motion";
import { Download, CheckCircle2, RefreshCw } from "lucide-react";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UpdateButtonProps {
  /** "light" for light dashboard headers, "dark" for dark glass headers */
  variant?: "light" | "dark";
  /** Compact mode shows just an icon (good for very tight headers / mobile) */
  compact?: boolean;
}

const UpdateButton = ({ variant = "light", compact = false }: UpdateButtonProps) => {
  const { updateAvailable, checking, applyUpdate } = useAppUpdate();

  if (checking) return null;

  const isDark = variant === "dark";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AnimatePresence mode="wait" initial={false}>
            {updateAvailable ? (
              <motion.button
                key="update"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={applyUpdate}
                className="relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <Download className="w-3.5 h-3.5" />
                {!compact && <span>Update available</span>}
              </motion.button>
            ) : (
              <motion.button
                key="uptodate"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={applyUpdate}
                className={
                  isDark
                    ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {!compact && <span>Up to date</span>}
              </motion.button>
            )}
          </AnimatePresence>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {updateAvailable ? (
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Click to refresh and load the latest version
            </span>
          ) : (
            <span>You're running the latest version</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UpdateButton;
