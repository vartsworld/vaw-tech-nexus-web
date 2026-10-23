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

/* ─────────────────────────── Cart maths ─────────────────────────── */

export interface CartSummary {
  pkg: PricingPackage | null;
  addons: PricingAddon[];
  quotedAddons: PricingAddon[];
  subtotal: number;
  /** Savings on the package versus its list price */
  savings: number;
  itemCount: number;
}

export const summarizeCart = (cart: CartState, packages: PricingPackage[], addons: PricingAddon[]): CartSummary => {
  const pkg = packages.find((p) => p.id === cart.packageId) ?? null;
  const selected = addons.filter((a) => cart.addonIds.includes(a.id));
  const priced = selected.filter((a) => a.price > 0);
  const quotedAddons = selected.filter((a) => a.price <= 0);
  const subtotal = (pkg?.price ?? 0) + priced.reduce((sum, a) => sum + a.price, 0);
  const savings = pkg ? Math.max(0, pkg.originalPrice - pkg.price) : 0;
  return {
    pkg,
    addons: selected,
    quotedAddons,
    subtotal,
    savings,
    itemCount: (pkg ? 1 : 0) + selected.length,
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
  coupon: z.string().trim().max(40).optional().or(z.literal("")),
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

const describeCart = (summary: CartSummary): string[] => {
  const lines: string[] = [];
  lines.push(`Package: ${summary.pkg ? `${summary.pkg.name} - ${formatPrice(summary.pkg.price)}` : "None selected"}`);
  if (summary.addons.length) {
    lines.push("Add-ons:");
    summary.addons.forEach((a) => lines.push(`  • ${a.name} - ${a.price > 0 ? formatPrice(a.price) : "Quote on request"}`));
  } else {
    lines.push("Add-ons: none");
  }
  lines.push(
    `Estimated total: ${formatPrice(summary.subtotal)}${summary.quotedAddons.length ? " (+ items quoted separately)" : ""}`
  );
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
    `Coupon: ${values.coupon || "-"}`,
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
