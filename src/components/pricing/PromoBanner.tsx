import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Check, Clock, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeDiscount, endOfDay, offerHasDiscount, type PromotionalOffer } from "@/lib/pricing";

interface PromoBannerProps {
  offer: PromotionalOffer | null;
  appliedCoupon: string;
  hasSelection: boolean;
  onApply: (code: string) => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const diff = (end: Date): TimeLeft | null => {
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
};

const PromoBanner = ({ offer, appliedCoupon, hasSelection, onApply }: PromoBannerProps) => {
  const end = useMemo(() => (offer?.end_date ? endOfDay(offer.end_date) : null), [offer?.end_date]);
  const [left, setLeft] = useState<TimeLeft | null>(() => (end ? diff(end) : null));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!end) {
      setLeft(null);
      return;
    }
    setLeft(diff(end));
    const id = setInterval(() => setLeft(diff(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (!offer?.is_enabled) return null;
  // Expired offers disappear on their own
  if (end && !left) return null;

  const code = offer.coupon_code?.trim();
  const applied = !!code && appliedCoupon.toUpperCase() === code.toUpperCase();
  const discountText = describeDiscount(offer);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="pb-10" aria-label="Current offer">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1A132B] via-[#12111E] to-[#0F172A] p-6 shadow-2xl shadow-amber-500/5 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {offer.badge_text || "Special limited offer"}
                </span>
                {(offer.discount_label || discountText) && (
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    {offer.discount_label || discountText}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">{offer.title}</h2>
              {offer.description && <p className="text-sm leading-relaxed text-gray-300">{offer.description}</p>}

              {!!offer.highlights?.length && (
                <ul className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  {offer.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 lg:col-span-5">
              {left && (
                <div className="w-full space-y-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-300/90">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Offer ends in</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
                    {(
                      [
                        ["Days", left.days],
                        ["Hours", left.hours],
                        ["Mins", left.minutes],
                        ["Secs", left.seconds],
                      ] as const
                    ).map(([label, val]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                        <div className="font-mono text-xl font-bold tabular-nums text-amber-300 sm:text-2xl">{String(val).padStart(2, "0")}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {code && (
                <div className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                  <div className="pl-1 text-left">
                    <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Coupon code</div>
                    <div className="font-mono text-base font-bold tracking-wide text-white">{code}</div>
                  </div>
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-amber-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

              {code && (
                <Button
                  type="button"
                  disabled={applied}
                  onClick={() => onApply(code)}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold text-black hover:from-amber-400 hover:to-orange-400 disabled:opacity-100 disabled:from-emerald-600 disabled:to-emerald-600 disabled:text-white"
                >
                  {applied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" /> Coupon applied to your plan
                    </>
                  ) : (
                    offer.button_text || "Claim your offer"
                  )}
                </Button>
              )}
              {code && !applied && (
                <p className="text-center text-xs text-gray-400">
                  {offerHasDiscount(offer) ? "Applied automatically to your plan total." : "Added to your request."}{" "}
                  {!hasSelection && "Pick a plan below to see your price."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
