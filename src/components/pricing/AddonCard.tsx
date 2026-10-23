import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice, type PricingAddon } from "@/lib/pricing";

interface AddonCardProps {
  addon: PricingAddon;
  selected: boolean;
  onToggle: (id: string) => void;
}

const AddonCard = ({ addon, selected, onToggle }: AddonCardProps) => (
  <article
    className={cn(
      "flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 transition-colors",
      selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-foreground/30"
    )}
  >
    <div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground leading-snug">{addon.name}</h3>
        <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
          {addon.price > 0 ? formatPrice(addon.price) : <span className="text-muted-foreground font-medium">Quote</span>}
        </span>
      </div>
      {addon.description && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{addon.description}</p>}
    </div>
    <Button
      type="button"
      size="sm"
      variant={selected ? "secondary" : "outline"}
      className="w-full"
      aria-pressed={selected}
      onClick={() => onToggle(addon.id)}
    >
      {selected ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" /> Added · Remove
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add to plan
        </>
      )}
    </Button>
  </article>
);

export default AddonCard;
