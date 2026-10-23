import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice, type PricingPackage } from "@/lib/pricing";

interface PackageCardProps {
  pkg: PricingPackage;
  selected: boolean;
  onToggle: (id: string) => void;
}

const PackageCard = ({ pkg, selected, onToggle }: PackageCardProps) => {
  const discount = pkg.originalPrice > pkg.price ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) : 0;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-6 transition-colors",
        selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-foreground/30"
      )}
      aria-label={`${pkg.name} package`}
    >
      <div className="flex items-start justify-between gap-3 min-h-[1.75rem]">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pkg.category}</span>
        {pkg.popular && (
          <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Most popular</span>
        )}
      </div>

      <h3 className="mt-3 text-xl font-bold text-foreground">{pkg.name}</h3>
      {pkg.description && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>}

      <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-3xl font-extrabold tabular-nums text-foreground">{formatPrice(pkg.price)}</span>
        {discount > 0 && (
          <>
            <span className="text-sm text-muted-foreground line-through tabular-nums">{formatPrice(pkg.originalPrice)}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Save {discount}%</span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">One-time price</p>

      <ul className="mt-5 space-y-2.5 flex-1">
        {pkg.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        className="mt-6 w-full font-semibold"
        variant={selected ? "secondary" : "default"}
        aria-pressed={selected}
        onClick={() => onToggle(pkg.id)}
      >
        {selected ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" /> Selected · Remove
          </>
        ) : (
          "Select this package"
        )}
      </Button>
    </article>
  );
};

export default PackageCard;
