import { FormEvent, useId, useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeDiscount, formatPrice, normalizeCode, validateCoupon, type CartSummary, type PromotionalOffer } from "@/lib/pricing";

interface CouponBoxProps {
  offer: PromotionalOffer | null;
  summary: CartSummary;
  onApply: (code: string) => void;
  onClear: () => void;
}

/** Enter a coupon, see it validated immediately, remove it again. */
const CouponBox = ({ offer, summary, onApply, onClear }: CouponBoxProps) => {
  const uid = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Only offer the box while a coupon can actually exist
  if (!offer?.is_enabled || !offer.coupon_code) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateCoupon(value, offer);
    if (!result.ok) {
      setError(result.reason ?? "That code isn't valid");
      return;
    }
    setError(null);
    onApply(normalizeCode(value));
    setValue("");
  };

  if (summary.couponCode) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3" role="status">
        <div className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <div>
            <p className="font-mono text-sm font-bold text-white">{summary.couponCode}</p>
            <p className="text-xs text-emerald-300">
              {summary.couponUnpriced
                ? "Code added. Our team confirms the discount in your quote."
                : `${describeDiscount(offer)} · you save ${formatPrice(summary.discount)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove coupon"
          className="rounded p-1 text-gray-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={`${uid}-input`} className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-300">
        <Tag className="h-3.5 w-3.5" aria-hidden="true" /> Have a coupon code?
      </label>
      <div className="flex gap-2">
        <Input
          id={`${uid}-input`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Enter code"
          autoCapitalize="characters"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-error` : undefined}
          className="h-10 border-white/10 bg-white/5 font-mono uppercase text-white placeholder:text-gray-500"
        />
        <Button type="submit" variant="secondary" className="h-10 shrink-0 bg-white/10 text-white hover:bg-white/20" disabled={!value.trim()}>
          Apply
        </Button>
      </div>
      {error && (
        <p id={`${uid}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      )}
    </form>
  );
};

export default CouponBox;
