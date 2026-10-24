// Pure helpers shared by the VAW Pay edge functions. No Deno or Supabase imports, so they can
// be tested with plain Node (see scripts/test-vawpay-integration.mjs).

const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export const hmacSha256Hex = async (secret: string, data: string): Promise<string> => {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
};

/** Constant-time string comparison (length is not secret). */
export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Verifies the gateway signature: `X-Gateway-Signature: sha256=<hex HMAC-SHA256(secret, rawBody)>`.
 * `rawBody` must be the exact bytes received, not a re-serialised JSON object.
 */
export const verifyGatewaySignature = async (secret: string, rawBody: string, header: string | null): Promise<boolean> => {
  if (!secret || !header) return false;
  const presented = header.replace(/^sha256=/i, "").trim().toLowerCase();
  const expected = await hmacSha256Hex(secret, rawBody);
  return safeEqual(presented, expected);
};

/** Gateway order ids must be unique per payment link, so every link gets a fresh suffix. */
export const buildOrderId = (inquiryId: string, now = Date.now()): string =>
  `VAW-${inquiryId.replace(/-/g, "").slice(0, 8).toUpperCase()}-${now.toString(36).toUpperCase()}`;

/** Rupees (number or numeric string) to integer paise, or null when invalid. */
export const rupeesToPaise = (value: unknown): number | null => {
  const n = typeof value === "string" ? Number(value.trim()) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) return null;
  return Math.round(n * 100);
};

export const paiseToRupeesString = (paise: number): string => (paise / 100).toFixed(2);

export type RequestStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

/** Maps a gateway webhook event to our status. Unknown events return null and are ignored. */
export const statusForEvent = (event: string): RequestStatus | null => {
  switch (String(event).toUpperCase()) {
    case "SUCCESS": return "paid";
    case "FAILED": return "failed";
    case "EXPIRED": return "expired";
    case "CANCELLED": return "cancelled";
    default: return null;
  }
};

/** A paid request is final: a late FAILED/EXPIRED delivery must never undo it. */
export const canTransition = (from: RequestStatus, to: RequestStatus): boolean => {
  if (from === to) return false;
  if (from === "paid") return false;
  return true;
};
