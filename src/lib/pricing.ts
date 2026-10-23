import { z } from "zod";

/* ─────────────────────────── Types ─────────────────────────── */

export interface PricingPackage {
  id: string;
  name: string;
  slug?: string;
  description: string;
  originalPrice: number;
  price: number;
  popular: boolean;
  features: string[];
  category: string;
  iconName?: string;
}

export interface PricingAddon {
  id: string;
  name: string;
  slug?: string;
  description: string;
  /** 0 means "quoted separately" */
  price: number;
}

export interface PromotionalOffer {
  is_enabled: boolean;
  badge_text?: string;
  title?: string;
  discount_label?: string;
  description?: string;
  coupon_code?: string;
  end_date?: string;
  button_text?: string;
  highlights?: string[];
  /** How the coupon reduces the price. Without a value the code is only recorded. */
  discount_type?: "percent" | "flat";
  discount_value?: number;
  /** Whether the discount applies to the package only or to the whole plan */
  applies_to?: "all" | "package";
}

export interface CartState {
  packageId: string | null;
  addonIds: string[];
  coupon: string;
}

export const EMPTY_CART: CartState = { packageId: null, addonIds: [], coupon: "" };

/* ─────────────────────────── Formatting ─────────────────────────── */

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatPrice = (value: number) => inr.format(Number.isFinite(value) ? value : 0);

/** Supabase `numeric` columns may arrive as strings – always coerce. */
export const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
};

/* ─────────────────────────── Categories ─────────────────────────── */

export const inferCategory = (name: string, description: string): string => {
  const text = `${name} ${description}`.toLowerCase();
  if (/(e-?commerce|store|shop|cart|catalog)/.test(text)) return "E-Commerce";
  if (/(\bai\b|\bbot\b|machine learning|automation|chatbot)/.test(text)) return "AI & Automation";
  if (/(news|social|media|feed|blog)/.test(text)) return "Media & News";
  return "Web Development";
};

/* ─────────────────────────── Tax & coupons ─────────────────────────── */

/** GST charged on top of every plan (India, services). */
export const GST_RATE = 0.18;
export const GST_LABEL = `${Math.round(GST_RATE * 100)}% GST`;

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

/** End of the (inclusive) end date, local time. */
export const endOfDay = (date: string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
};

export interface CouponCheck {
  ok: boolean;
  reason?: string;
}

/** Is `code` an active, unexpired coupon right now? */
export const validateCoupon = (code: string, offer: PromotionalOffer | null | undefined): CouponCheck => {
  const wanted = normalizeCode(code);
  if (!wanted) return { ok: false, reason: "Enter a coupon code" };
  const actual = normalizeCode(offer?.coupon_code ?? "");
  if (!offer?.is_enabled || !actual) return { ok: false, reason: "That code isn't valid" };
  if (offer.end_date) {
    const end = endOfDay(offer.end_date);
    if (end && end.getTime() < Date.now()) return { ok: false, reason: "This offer has expired" };
  }
  if (wanted !== actual) return { ok: false, reason: "That code isn't valid" };
  return { ok: true };
};

/** Does this offer actually take money off (as opposed to only being recorded)? */
export const offerHasDiscount = (offer: PromotionalOffer | null | undefined) =>
  !!offer && (offer.discount_type === "percent" || offer.discount_type === "flat") && toNumber(offer.discount_value) > 0;

export const describeDiscount = (offer: PromotionalOffer | null | undefined) => {
  if (!offerHasDiscount(offer)) return "";
  const v = toNumber(offer!.discount_value);
  return offer!.discount_type === "percent" ? `${v}% off` : `${formatPrice(v)} off`;
};

/* ─────────────────────────── Cart maths ─────────────────────────── */

export interface CartSummary {
  pkg: PricingPackage | null;
  addons: PricingAddon[];
  quotedAddons: PricingAddon[];
  /** Package + priced add-ons, before coupon and GST */
  subtotal: number;
  /** Savings on the package versus its list price */
  savings: number;
  itemCount: number;
  /** Applied (valid) coupon code, or "" */
  couponCode: string;
  /** Money taken off by the coupon */
  discount: number;
  /** Coupon is valid but the offer carries no discount value (confirmed by our team) */
  couponUnpriced: boolean;
  /** subtotal - discount */
  taxable: number;
  gstRate: number;
  gst: number;
  /** What the customer would pay: taxable + GST */
  total: number;
}

export const summarizeCart = (
  cart: CartState,
  packages: PricingPackage[],
  addons: PricingAddon[],
  offer?: PromotionalOffer | null
): CartSummary => {
  const pkg = packages.find((p) => p.id === cart.packageId) ?? null;
  const selected = addons.filter((a) => cart.addonIds.includes(a.id));
  const priced = selected.filter((a) => a.price > 0);
  const quotedAddons = selected.filter((a) => a.price <= 0);
  const subtotal = (pkg?.price ?? 0) + priced.reduce((sum, a) => sum + a.price, 0);
  const savings = pkg ? Math.max(0, pkg.originalPrice - pkg.price) : 0;

  let couponCode = "";
  let discount = 0;
  let couponUnpriced = false;
  if (cart.coupon && subtotal > 0 && validateCoupon(cart.coupon, offer).ok) {
    couponCode = normalizeCode(cart.coupon);
    if (offerHasDiscount(offer)) {
      const base = offer!.applies_to === "package" ? pkg?.price ?? 0 : subtotal;
      const value = toNumber(offer!.discount_value);
      discount = offer!.discount_type === "percent" ? Math.round((base * Math.min(value, 100)) / 100) : Math.min(value, base);
    } else {
      couponUnpriced = true;
    }
  }

  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * GST_RATE);
  return {
    pkg,
    addons: selected,
    quotedAddons,
    subtotal,
    savings,
    itemCount: (pkg ? 1 : 0) + selected.length,
    couponCode,
    discount,
    couponUnpriced,
    taxable,
    gstRate: GST_RATE,
    gst,
    total: taxable + gst,
  };
};

/* ─────────────────────────── Validation ─────────────────────────── */

const phoneRegex = /^[+()\d][\d\s().-]{6,17}$/;

export const TIMELINE_OPTIONS = [
  { value: "ASAP (rush)", label: "As soon as possible" },
  { value: "Within 1 week", label: "Within 1 week" },
  { value: "Within 2 weeks", label: "Within 2 weeks" },
  { value: "Within 1 month", label: "Within 1 month" },
  { value: "Within 2-3 months", label: "Within 2–3 months" },
  { value: "Flexible", label: "I'm flexible" },
];

export const BUDGET_OPTIONS = [
  { value: "Under ₹25,000", label: "Under ₹25,000" },
  { value: "₹25,000 – ₹75,000", label: "₹25,000 – ₹75,000" },
  { value: "₹75,000 – ₹2,00,000", label: "₹75,000 – ₹2,00,000" },
  { value: "₹2,00,000+", label: "₹2,00,000 or more" },
  { value: "Not sure yet", label: "Not sure yet" },
];

export const REQUEST_TYPES = [
  { value: "New website", label: "New website" },
  { value: "Web / mobile app", label: "Web or mobile app" },
  { value: "E-commerce store", label: "E-commerce store" },
  { value: "AI / automation", label: "AI or automation" },
  { value: "Redesign / revamp", label: "Redesign of an existing site" },
  { value: "Digital marketing", label: "Digital marketing" },
  { value: "Something else", label: "Something else" },
];

const contactFields = {
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  company: z.string().trim().max(150).optional().or(z.literal("")),
};

export const checkoutSchema = z.object({
  ...contactFields,
  domain: z.string().trim().max(150).optional().or(z.literal("")),
  timeline: z.string().min(1, "Choose a timeline"),
  notes: z.string().trim().max(1500, "Please keep notes under 1500 characters").optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Please confirm so we can contact you" }) }),
  /** honeypot – must stay empty */
  website: z.string().max(0).optional().or(z.literal("")),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const customRequestSchema = z.object({
  ...contactFields,
  requestType: z.string().min(1, "Choose what you need"),
  budget: z.string().min(1, "Choose a budget range"),
  timeline: z.string().min(1, "Choose a timeline"),
  details: z
    .string()
    .trim()
    .min(20, "Please describe your request in at least 20 characters")
    .max(2000, "Please keep this under 2000 characters"),
  includeCart: z.boolean().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please confirm so we can contact you" }) }),
  website: z.string().max(0).optional().or(z.literal("")),
});
export type CustomRequestValues = z.infer<typeof customRequestSchema>;

/* ─────────────────────────── Submission helpers ─────────────────────────── */

export const generateReference = () => {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `VAW-${stamp}${rand}`;
};

/**
 * Plain-text summary stored with the request. The HR dashboard parses these
 * "Label: value" lines, so keep the labels stable.
 */
export const describeCart = (summary: CartSummary): string[] => {
  const lines: string[] = [];
  lines.push(`Package: ${summary.pkg ? `${summary.pkg.name} - ${formatPrice(summary.pkg.price)}` : "None selected"}`);
  if (summary.addons.length) {
    lines.push("Add-ons:");
    summary.addons.forEach((a) => lines.push(`  • ${a.name} - ${a.price > 0 ? formatPrice(a.price) : "Quote on request"}`));
  } else {
    lines.push("Add-ons: none");
  }
  lines.push(`Subtotal: ${formatPrice(summary.subtotal)}`);
  if (summary.couponCode) {
    lines.push(`Coupon: ${summary.couponCode}`);
    lines.push(`Discount: ${formatPrice(summary.discount)}`);
  } else {
    lines.push("Coupon: -");
  }
  lines.push(`Taxable amount: ${formatPrice(summary.taxable)}`);
  lines.push(`GST (${Math.round(summary.gstRate * 100)}%): ${formatPrice(summary.gst)}`);
  lines.push(`Total payable: ${formatPrice(summary.total)}${summary.quotedAddons.length ? " (+ items quoted separately)" : ""}`);
  return lines;
};

export const buildPlanMessage = (values: CheckoutValues, summary: CartSummary, reference: string) =>
  [
    `Reference: ${reference}`,
    "Type: Plan request",
    `Company: ${values.company || "-"}`,
    `Preferred Domain: ${values.domain || "-"}`,
    `Timeline: ${values.timeline}`,
    ...describeCart(summary),
    `Requirements: ${(values.notes || "-").replace(/\r?\n/g, " ")}`,
  ].join("\n");

export const buildCustomMessage = (values: CustomRequestValues, summary: CartSummary | null, reference: string) =>
  [
    `Reference: ${reference}`,
    "Type: Custom request",
    `Company: ${values.company || "-"}`,
    `Request type: ${values.requestType}`,
    `Budget: ${values.budget}`,
    `Timeline: ${values.timeline}`,
    ...(summary && summary.itemCount > 0 ? ["Selected so far:", ...describeCart(summary)] : []),
    `Requirements: ${values.details.replace(/\r?\n/g, " ")}`,
  ].join("\n");

/* ─────────────────────────── Persistence ─────────────────────────── */

export const CART_STORAGE_KEY = "vaw_pricing_cart_v1";
const SUBMIT_COOLDOWN_KEY = "vaw_pricing_last_submit";
const SUBMIT_COOLDOWN_MS = 20_000;

export const loadCart = (): CartState => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    return {
      packageId: typeof parsed.packageId === "string" ? parsed.packageId : null,
      addonIds: Array.isArray(parsed.addonIds) ? parsed.addonIds.filter((x: unknown) => typeof x === "string") : [],
      coupon: typeof parsed.coupon === "string" ? parsed.coupon : "",
    };
  } catch {
    return EMPTY_CART;
  }
};

export const saveCart = (cart: CartState) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable (private mode) – cart simply won't persist */
  }
};

/** Basic client-side throttle so a double-click or bot can't flood the inbox. */
export const canSubmitNow = (): boolean => {
  try {
    const last = Number(localStorage.getItem(SUBMIT_COOLDOWN_KEY) || 0);
    return Date.now() - last > SUBMIT_COOLDOWN_MS;
  } catch {
    return true;
  }
};

export const markSubmitted = () => {
  try {
    localStorage.setItem(SUBMIT_COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};
