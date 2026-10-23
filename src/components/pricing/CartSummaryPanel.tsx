import { ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { GST_LABEL, formatPrice, type CartSummary } from "@/lib/pricing";

interface CartSummaryPanelProps {
  summary: CartSummary;
  onRemovePackage?: () => void;
  onRemoveAddon?: (id: string) => void;
  onClear?: () => void;
  /** Coupon entry / chip, shown between the items and the totals */
  coupon?: ReactNode;
  /** Primary call to action (omit for read-only summaries) */
  action?: ReactNode;
  footer?: ReactNode;
}

const Line = ({ label, value, onRemove, removeLabel }: { label: ReactNode; value: ReactNode; onRemove?: () => void; removeLabel?: string }) => (
  <li className="flex items-start justify-between gap-3 py-2.5 text-sm">
    <span className="flex min-w-0 items-start gap-1.5 text-gray-100">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="mt-0.5 shrink-0 rounded p-0.5 text-gray-500 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <span className="min-w-0 break-words">{label}</span>
    </span>
    <span className="shrink-0 tabular-nums text-gray-100">{value}</span>
  </li>
);

const Total = ({ label, value, muted }: { label: string; value: ReactNode; muted?: boolean }) => (
  <div className={`flex items-baseline justify-between text-sm ${muted ? "text-gray-400" : "text-gray-100"}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

const CartSummaryPanel = ({ summary, onRemovePackage, onRemoveAddon, onClear, coupon, action, footer }: CartSummaryPanelProps) => {
  const { pkg, addons, quotedAddons, subtotal, savings, itemCount, discount, couponCode, gst, total } = summary;

  return (
    <section aria-label="Your plan" className="text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Your plan</h2>
        {onClear && itemCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded text-xs text-gray-400 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {itemCount === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-gray-400">Nothing selected yet. Choose a package, then add any extras you need.</p>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-white/10" aria-live="polite">
            {pkg && <Line label={pkg.name} value={formatPrice(pkg.price)} onRemove={onRemovePackage} removeLabel={`Remove ${pkg.name}`} />}
            {addons.map((a) => (
              <Line
                key={a.id}
                label={a.name}
                value={a.price > 0 ? formatPrice(a.price) : <span className="text-gray-400">Quote</span>}
                onRemove={onRemoveAddon ? () => onRemoveAddon(a.id) : undefined}
                removeLabel={`Remove ${a.name}`}
              />
            ))}
          </ul>

          {coupon && <div className="mt-3">{coupon}</div>}

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <Total label="Subtotal" value={formatPrice(subtotal)} />
            {discount > 0 && (
              <Total
                label={`Coupon ${couponCode}`}
                value={<span className="text-emerald-400">− {formatPrice(discount)}</span>}
              />
            )}
            <Total label={GST_LABEL} value={formatPrice(gst)} muted />
            <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
              <span className="text-sm font-semibold">Total payable</span>
              <span className="text-2xl font-extrabold tabular-nums">{formatPrice(total)}</span>
            </div>
            {savings > 0 && <p className="text-right text-xs font-medium text-emerald-400">You save {formatPrice(savings)} on the package</p>}
            {quotedAddons.length > 0 && (
              <p className="text-right text-xs text-gray-400">
                + {quotedAddons.length} item{quotedAddons.length > 1 ? "s" : ""} quoted separately
              </p>
            )}
          </div>
        </>
      )}

      {action && <div className="mt-5">{action}</div>}
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        An estimate, not an invoice. The total includes {GST_LABEL}. No payment is taken now; we confirm scope and final price with you first.
      </p>
      {footer}
    </section>
  );
};

export default CartSummaryPanel;
