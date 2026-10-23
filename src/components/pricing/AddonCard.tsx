import { Check, Plus } from "lucide-react";
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
      "flex flex-col justify-between rounded-2xl border bg-[#121218] p-5 transition-colors",
      selected ? "border-indigo-400 ring-2 ring-indigo-400/40" : "border-white/10 hover:border-indigo-500/40"
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold leading-snug text-white">{addon.name}</h3>
        {addon.description && <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{addon.description}</p>}
      </div>
      <span className="shrink-0 whitespace-nowrap rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold tabular-nums text-emerald-400">
        {addon.price > 0 ? formatPrice(addon.price) : "Custom quote"}
      </span>
    </div>

    <div className="mt-5 flex items-center justify-end border-t border-white/10 pt-4">
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onToggle(addon.id)}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400",
          selected ? "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30" : "bg-white/5 text-indigo-300 hover:bg-white/10 hover:text-white"
        )}
      >
        {selected ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Added · remove
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add to project
          </>
        )}
      </button>
    </div>
  </article>
);

export default AddonCard;
