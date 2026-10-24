// Receives VAW Pay gateway webhooks and updates `payment_requests`.
// Public endpoint (verify_jwt = false in supabase/config.toml): authenticity comes from the HMAC signature.
//
// Point the gateway's merchant webhook URL at:
//   https://<project-ref>.supabase.co/functions/v1/vaw-pay-webhook
// Secret: VAW_PAY_WEBHOOK_SECRET must equal the merchant webhook secret in the gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { canTransition, statusForEvent, verifyGatewaySignature } from "../_shared/vawpay.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const secret = Deno.env.get("VAW_PAY_WEBHOOK_SECRET") || "";
  if (!secret) return json(503, { error: "Webhook secret not configured" });

  const raw = await req.text();
  const ok = await verifyGatewaySignature(secret, raw, req.headers.get("x-gateway-signature"));
  if (!ok) return json(401, { error: "Invalid signature" });

  let event: any;
  try { event = JSON.parse(raw); } catch { return json(400, { error: "Invalid JSON" }); }

  const next = statusForEvent(event.event);
  if (!next) return json(200, { ignored: true }); // acknowledge unknown events so the gateway stops retrying

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row } = await admin
    .from("payment_requests").select("*")
    .or(`gateway_payment_id.eq.${String(event.paymentId).replace(/[^0-9a-zA-Z-]/g, "")},order_id.eq.${String(event.orderId).replace(/[^0-9a-zA-Z-]/g, "")}`)
    .maybeSingle();
  if (!row) return json(200, { ignored: true, reason: "unknown order" }); // not ours (e.g. another use of the gateway)

  // The amount the gateway confirmed must be what we asked for.
  if (next === "paid" && Number(event.amountPaise) !== Number(row.amount_paise)) {
    console.error("vaw-pay-webhook: amount mismatch", { orderId: row.order_id, expected: row.amount_paise, got: event.amountPaise });
    return json(409, { error: "Amount mismatch" });
  }
  if (!canTransition(row.status, next)) return json(200, { unchanged: true });

  const { error } = await admin.from("payment_requests").update({
    status: next,
    utr: next === "paid" ? String(event.utr || "") || null : row.utr,
    paid_at: next === "paid" ? new Date().toISOString() : row.paid_at,
    updated_at: new Date().toISOString(),
  }).eq("id", row.id);
  if (error) return json(500, { error: "Could not update" }); // non-2xx makes the gateway retry

  return json(200, { ok: true });
});
