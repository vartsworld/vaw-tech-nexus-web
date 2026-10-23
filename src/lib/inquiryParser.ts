/**
 * Helpers for reading the `inquiries` table in the HR dashboard.
 * Plan and custom requests from /pricing store their details as plain
 * "Label: value" lines in `message` (see `describeCart` in lib/pricing.ts).
 */

export type InquiryKind = "plan" | "custom" | "general";

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface ParsedInquiry {
  row: InquiryRow;
  kind: InquiryKind;
  reference: string;
  company: string;
  domain: string;
  timeline: string;
  budget: string;
  requestType: string;
  packageName: string;
  addons: string[];
  subtotal: number | null;
  coupon: string;
  discount: number;
  gst: number | null;
  total: number | null;
  notes: string;
  status: string;
}

export const INQUIRY_STATUSES = [
  { value: "new", label: "New", tone: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "in-progress", label: "In progress", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "completed", label: "Won / completed", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "closed", label: "Closed / lost", tone: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
] as const;

export const statusMeta = (status: string | null | undefined) =>
  INQUIRY_STATUSES.find((s) => s.value === (status || "new")) ?? INQUIRY_STATUSES[0];

const clean = (v: string) => (v.trim() === "-" ? "" : v.trim());

export const parseMoney = (text: string | undefined | null): number | null => {
  if (!text) return null;
  const m = text.match(/₹\s*([\d,]+(?:\.\d+)?)/) ?? text.match(/^\s*([\d,]+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const line = (lines: string[], label: string): string => {
  const hit = lines.find((l) => l.toLowerCase().startsWith(label.toLowerCase() + ":"));
  return hit ? hit.slice(label.length + 1).trim() : "";
};

export const parseInquiry = (row: InquiryRow): ParsedInquiry => {
  const message = row.message || "";
  const lines = message.split(/\r?\n/);
  const service = row.service || "";
  const structured = lines[0]?.startsWith("Reference:");
  const typeLine = line(lines, "Type").toLowerCase();

  let kind: InquiryKind = "general";
  if (service.startsWith("Custom Request") || typeLine.includes("custom")) kind = "custom";
  else if (typeLine.includes("plan") || service.includes("₹") || /package/i.test(service)) kind = "plan";

  // Add-ons are the indented bullet lines following "Add-ons:"
  const addons: string[] = [];
  const addonIdx = lines.findIndex((l) => l.startsWith("Add-ons:"));
  if (addonIdx >= 0) {
    for (let i = addonIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (/^\s+•/.test(l)) addons.push(l.replace(/^\s+•\s*/, "").trim());
      else break;
    }
  }

  const packageLine = line(lines, "Package");
  const couponRaw = clean(line(lines, "Coupon"));
  const totalLine = line(lines, "Total payable") || line(lines, "Estimated total");

  return {
    row,
    kind,
    reference: structured ? line(lines, "Reference") : "",
    company: clean(line(lines, "Company")),
    domain: clean(line(lines, "Preferred Domain")),
    timeline: clean(line(lines, "Timeline")),
    budget: clean(line(lines, "Budget")),
    requestType: clean(line(lines, "Request type")) || clean(line(lines, "Website Type")),
    packageName: packageLine ? packageLine.split(" - ")[0] : service.split(" - ")[0],
    addons,
    subtotal: parseMoney(line(lines, "Subtotal")),
    coupon: couponRaw.split(/\s+/)[0] ?? "",
    discount: parseMoney(line(lines, "Discount")) ?? 0,
    gst: parseMoney(line(lines, "GST (18%)")),
    total: parseMoney(totalLine) ?? parseMoney(service.split(" - ").slice(-1)[0]),
    notes: structured ? clean(line(lines, "Requirements")) : message,
    status: row.status || "new",
  };
};

/** True for rows that came from the pricing page (plan or custom request). */
export const isPricingInquiry = (row: InquiryRow) => parseInquiry(row).kind !== "general";

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

/** Which inquiries claimed the given coupon code? */
export const claimsForCoupon = (rows: InquiryRow[], code: string): ParsedInquiry[] => {
  const wanted = normalizeCode(code);
  if (!wanted) return [];
  return rows
    .map(parseInquiry)
    .filter((p) => p.kind === "plan" && normalizeCode(p.coupon) === wanted);
};

export const csvEscape = (v: unknown) => {
  const s = String(v ?? "");
  // Neutralise spreadsheet formula injection
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
