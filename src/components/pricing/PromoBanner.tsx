import { useMemo } from "react";
import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromotionalOffer } from "@/lib/pricing";

interface PromoBannerProps {
  offer: PromotionalOffer | null;
  appliedCoupon: string;
  onApply: (code: string) => void;
}

/** End of the (inclusive) end date, local time. */
const endOfDay = (date: string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
};

const PromoBanner = ({ offer, appliedCoupon, onApply }: PromoBannerProps) => {
  const info = useMemo(() => {
    if (!offer?.is_enabled) return null;
    let daysLeft: number | null = null;
    if (offer.end_date) {
      const end = endOfDay(offer.end_date);
      if (!end) return null;
      const ms = end.getTime() - Date.now();
      if (ms <= 0) return null; // expired – hide
      daysLeft = Math.ceil(ms / 86_400_000);
    }
    return { daysLeft };
  }, [offer]);

  if (!offer || !info) return null;

  const code = offer.coupon_code?.trim();
  const applied = !!code && appliedCoupon.toUpperCase() === code.toUpperCase();

  return (
    <aside className="rounded-xl border border-primary/40 bg-primary/10 p-4 sm:p-5" aria-label="Current offer">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Tag className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">
              {offer.title || "Limited-time offer"}
              {offer.discount_label ? <span className="ml-2 text-brand">{offer.discount_label}</span> : null}
            </p>
            {offer.description && <p className="mt-0.5 text-sm text-muted-foreground">{offer.description}</p>}
            {info.daysLeft !== null && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {info.daysLeft === 1 ? "Last day" : `${info.daysLeft} days left`}
              </p>
            )}
          </div>
        </div>
        {code && (
          <Button type="button" variant={applied ? "secondary" : "default"} className="shrink-0 font-semibold" onClick={() => onApply(code)} disabled={applied}>
            {applied ? (
              <>
                <Check className="h-4 w-4" /> {code} added
              </>
            ) : (
              <>Use code {code}</>
            )}
          </Button>
        )}
      </div>
    </aside>
  );
};

export default PromoBanner;
