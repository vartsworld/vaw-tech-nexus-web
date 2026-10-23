import { ReactNode } from "react";
import { ChevronUp, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice, type CartSummary } from "@/lib/pricing";

interface CartDrawerProps {
  summary: CartSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  /** Cart contents (CartSummaryPanel) rendered inside the drawer */
  children: ReactNode;
}

/**
 * Bottom cart bar + drawer, used on every screen size.
 * The bar is pinned to the bottom while anything is selected; tapping it opens the full plan.
 */
const CartDrawer = ({ summary, open, onOpenChange, onContinue, children }: CartDrawerProps) => {
  if (summary.itemCount === 0 && !open) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-white/15 bg-[#14141b]/95 p-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            aria-label={`Review your plan, ${summary.itemCount} item${summary.itemCount === 1 ? "" : "s"}, total ${formatPrice(summary.total)}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <ShoppingBag className="h-5 w-5 text-white" aria-hidden="true" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[11px] font-bold text-white">
                {summary.itemCount}
              </span>
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                Your plan · incl. GST <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="block truncate text-lg font-extrabold tabular-nums text-white">{formatPrice(summary.total)}</span>
            </span>
          </button>
          <Button type="button" onClick={onContinue} className="h-11 shrink-0 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
            Continue
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="dark mx-auto max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-white/10 bg-[#0E0E13] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-white sm:max-w-xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Your plan</SheetTitle>
            <SheetDescription>Review the items in your plan, apply a coupon and continue.</SheetDescription>
          </SheetHeader>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
          {children}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CartDrawer;
