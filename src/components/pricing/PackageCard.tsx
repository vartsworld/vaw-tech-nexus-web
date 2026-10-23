import { ArrowRight, Bot, Check, Globe, Package, Shield, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GST_LABEL, formatPrice, type PricingPackage } from "@/lib/pricing";

interface PackageCardProps {
  pkg: PricingPackage;
  selected: boolean;
  onSelect: (id: string) => void;
}

const ICONS: Record<string, { Icon: typeof Globe; color: string }> = {
  Globe: { Icon: Globe, color: "text-sky-400" },
  Zap: { Icon: Zap, color: "text-violet-400" },
  Shield: { Icon: Shield, color: "text-amber-400" },
  Star: { Icon: Star, color: "text-rose-400" },
  TrendingUp: { Icon: TrendingUp, color: "text-violet-400" },
  Bot: { Icon: Bot, color: "text-emerald-400" },
  Package: { Icon: Package, color: "text-sky-400" },
  Sparkles: { Icon: Sparkles, color: "text-amber-400" },
};

const PackageCard = ({ pkg, selected, onSelect }: PackageCardProps) => {
  const { Icon, color } = ICONS[pkg.iconName ?? "Globe"] ?? ICONS.Globe;
  const hasDiscount = pkg.originalPrice > pkg.price;
  const savings = pkg.originalPrice - pkg.price;
  const pct = hasDiscount ? Math.round((savings / pkg.originalPrice) * 100) : 0;

  return (
    <article
      aria-label={`${pkg.name} package`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-[#111116] transition-all duration-200",
        selected
          ? "border-indigo-400 ring-2 ring-indigo-400/50"
          : pkg.popular
            ? "border-indigo-500/50 hover:border-indigo-400/80"
            : "border-white/10 hover:border-white/25"
      )}
    >
      {pkg.popular && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Most popular
        </div>
      )}

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Icon className={cn("h-6 w-6", color)} aria-hidden="true" />
          </div>
          <span className={cn("rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-gray-400", pkg.popular && "mr-20")}>
            {pkg.category}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-bold text-white sm:text-2xl">{pkg.name}</h3>
        <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-gray-400">{pkg.description}</p>

        <div className="mt-5 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-white sm:text-4xl">{formatPrice(pkg.price)}</span>
            {hasDiscount && <span className="text-sm tabular-nums text-gray-500 line-through">{formatPrice(pkg.originalPrice)}</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {hasDiscount && (
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                Save {formatPrice(savings)} ({pct}% off)
              </span>
            )}
            <span className="text-[11px] text-gray-500">One-time price · + {GST_LABEL}</span>
          </div>
        </div>

        <p className="mb-3 mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">What's included</p>
        <ul className="space-y-2.5">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0">
        <Button
          type="button"
          aria-pressed={selected}
          onClick={() => onSelect(pkg.id)}
          className={cn(
            "h-11 w-full rounded-xl text-sm font-semibold transition-colors",
            selected
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : pkg.popular
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500"
                : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {selected ? (
            <>
              <Check className="mr-2 h-4 w-4" aria-hidden="true" /> Selected · tap to remove
            </>
          ) : (
            <>
              Select this plan <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </article>
  );
};

export default PackageCard;
