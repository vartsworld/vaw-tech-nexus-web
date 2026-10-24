// Creates a VAW Pay payment link for a website request (inquiry). HR / super admin only.
//
// POST { inquiryId: string, amount: number }  (amount in rupees, GST included)
// -> { paymentRequest: { id, status, checkoutUrl, amountPaise, orderId } }
//
// Secrets (supabase secrets set ...):
//   VAW_PAY_API_URL        public base URL of the gateway payment API, e.g. https://pay.vawtech.com
//   VAW_PAY_MERCHANT_KEY   the gateway merchant key (the merchant webhook secret also works as a key)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildOrderId, paiseToRupeesString, rupeesToPaise } from "../_shared/vawpay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const gatewayUrl = (Deno.env.get("VAW_PAY_API_URL") || "").replace(/\/+$/, "");
  const merchantKey = Deno.env.get("VAW_PAY_MERCHANT_KEY") || "";
  if (!gatewayUrl || !merchantKey) {
    return json(503, { error: "VAW Pay is not configured. Set VAW_PAY_API_URL and VAW_PAY_MERCHANT_KEY." });
  }

  // Who is calling? Must be a signed-in HR / super admin.
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) return json(401, { error: "Sign in required" });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin
    .from("staff_profiles").select("role").eq("user_id", userData.user.id).maybeSingle();
  if (!profile || !["hr", "super_admin"].includes(profile.role)) return json(403, { error: "HR access required" });

  let body: { inquiryId?: string; amount?: unknown };
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }
  const inquiryId = String(body.inquiryId || "");
  const amountPaise = rupeesToPaise(body.amount);
  if (!/^[0-9a-f-]{36}$/i.test(inquiryId)) return json(400, { error: "inquiryId is required" });
  if (amountPaise === null) return json(400, { error: "Enter a valid amount in rupees" });

  const { data: inquiry } = await admin.from("inquiries").select("id,name").eq("id", inquiryId).maybeSingle();
  if (!inquiry) return json(404, { error: "Request not found" });

  // Don't stack links: if an unpaid link for this exact amount exists, reuse it; refuse if already paid.
  const { data: existing } = await admin
    .from("payment_requests").select("*").eq("inquiry_id", inquiryId).order("created_at", { ascending: false });
  if (existing?.some((r: any) => r.status === "paid")) {
    return json(409, { error: "This request has already been paid.", code: "ALREADY_PAID" });
  }
  const reusable = existing?.find((r: any) => r.status === "pending" && Number(r.amount_paise) === amountPaise && r.checkout_url);
  if (reusable) return json(200, { paymentRequest: shape(reusable), reused: true });

  const orderId = buildOrderId(inquiryId);
  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(`${gatewayUrl}/api/v1/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Merchant-Key": merchantKey },
      body: JSON.stringify({
        orderId,
        amount: paiseToRupeesString(amountPaise),
        currency: "INR",
        metadata: { source: "vaw-site", inquiryId, customerName: inquiry.name },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    return json(502, { error: "Could not reach the payment gateway", detail: String((e as Error).message) });
  }
  const gateway = await gatewayRes.json().catch(() => ({}));
  if (!gatewayRes.ok || !gateway.paymentId || !gateway.checkoutUrl) {
    return json(502, { error: gateway.error || "Gateway rejected the payment", code: gateway.code });
  }

  const { data: row, error: insertError } = await admin.from("payment_requests").insert({
    inquiry_id: inquiryId,
    order_id: orderId,
    gateway_payment_id: gateway.paymentId,
    amount_paise: amountPaise,
    checkout_url: gateway.checkoutUrl,
    status: "pending",
    created_by: userData.user.id,
  }).select("*").single();
  if (insertError) return json(500, { error: "Payment link was created but could not be saved", detail: insertError.message });

  return json(201, { paymentRequest: shape(row) });
});

const shape = (r: any) => ({
  id: r.id, status: r.status, checkoutUrl: r.checkout_url, amountPaise: Number(r.amount_paise), orderId: r.order_id,
});
