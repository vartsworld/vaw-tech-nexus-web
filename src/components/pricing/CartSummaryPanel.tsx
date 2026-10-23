import { ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, type CartSummary } from "@/lib/pricing";

interface CartSummaryPanelProps {
  summary: CartSummary;
  coupon?: string;
  onRemovePackage?: () => void;
  onRemoveAddon?: (id: string) => void;
  onClearCoupon?: () => void;
  onClear?: () => void;
  /** Primary call to action (hidden when omitted, e.g. on read-only summaries) */
  action?: ReactNode;
  footer?: ReactNode;
}

const Row = ({ label, value, onRemove, removeLabel }: { label: string; value: ReactNode; onRemove?: () => void; removeLabel?: string }) => (
  <li className="flex items-start justify-between gap-3 py-2.5 text-sm">
    <span className="flex items-start gap-1.5 text-foreground">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-0.5 rounded p-0.5 text-muted-foreground hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={removeLabel}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
      <span>{label}</span>
    </span>
    <span className="shrink-0 font-medium tabular-nums text-foreground">{value}</span>
  </li>
);

const CartSummaryPanel = ({ summary, coupon, onRemovePackage, onRemoveAddon, onClearCoupon, onClear, action, footer }: CartSummaryPanelProps) => {
  const { pkg, addons, subtotal, savings, itemCount, quotedAddons } = summary;

  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-label="Your plan">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Your plan</h2>
        {onClear && itemCount > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={onClear}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear
          </Button>
        )}
      </div>

      {itemCount === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Nothing selected yet. Choose a package, then add any extras you need. Your total updates as you go.
        </p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border" aria-live="polite">
            {pkg && (
              <Row
                label={pkg.name}
                value={formatPrice(pkg.price)}
                onRemove={onRemovePackage}
                removeLabel={`Remove ${pkg.name}`}
              />
            )}
            {addons.map((a) => (
              <Row
                key={a.id}
                label={a.name}
                value={a.price > 0 ? formatPrice(a.price) : <span className="text-muted-foreground">Quote</span>}
                onRemove={onRemoveAddon ? () => onRemoveAddon(a.id) : undefined}
                removeLabel={`Remove ${a.name}`}
              />
            ))}
            {coupon && (
              <Row
                label={`Coupon ${coupon}`}
                value={<span className="text-xs text-muted-foreground font-normal">verified by our team</span>}
                onRemove={onClearCoupon}
                removeLabel="Remove coupon"
              />
            )}
          </ul>

          <div className="mt-3 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Estimated total</span>
              <span className="text-2xl font-extrabold tabular-nums text-foreground">{formatPrice(subtotal)}</span>
            </div>
            {savings > 0 && (
              <p className="mt-1 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                You save {formatPrice(savings)} on the package
              </p>
            )}
            {quotedAddons.length > 0 && (
              <p className="mt-1 text-right text-xs text-muted-foreground">
                + {quotedAddons.length} item{quotedAddons.length > 1 ? "s" : ""} quoted separately
              </p>
            )}
          </div>
        </>
      )}

      {action && <div className="mt-5">{action}</div>}
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        This is an estimate, not an invoice. No payment is taken now. We confirm scope and final price with you first.
      </p>
      {footer}
    </section>
  );
};

export default CartSummaryPanel;
