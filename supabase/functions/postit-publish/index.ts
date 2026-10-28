// Optional auto-publisher for the Post Scheduler (/postit).
//
//   POST (cron):  header `x-cron-secret: <POSTIT_CRON_SECRET>`: publishes every due post that is set to "auto"
//                 and checks the status of posts already sent.  Schedule it every 5 minutes (see docs/POST_SCHEDULER.md).
//   POST (staff): `Authorization: Bearer <user JWT>` with body {"postId": "<uuid>"}: "Publish now" for one post.
//
// Secrets: MUAPI_API_KEY (required), POSTIT_CRON_SECRET (for the scheduled run).
// verify_jwt is off in supabase/config.toml because the cron caller has no user JWT; this function authenticates itself.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPublishRequest, interpretPrediction, predictionUrl, PUBLISHING_TIMEOUT_MS } from "../_shared/postit.ts";
import { safeEqual } from "../_shared/vawpay.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("MUAPI_API_KEY");
  if (!apiKey) return json(503, { error: "Auto-publishing isn't configured: MUAPI_API_KEY is not set." });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // --- who is calling? ---
  const cronSecret = Deno.env.get("POSTIT_CRON_SECRET") || "";
  const presented = req.headers.get("x-cron-secret") || "";
  let mode: "cron" | "user" = "user";
  if (cronSecret && presented && safeEqual(presented, cronSecret)) {
    mode = "cron";
  } else {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "Unauthorized" });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json(401, { error: "Unauthorized" });
    const { data: sp } = await admin.from("staff_profiles").select("application_status").eq("user_id", user.id).maybeSingle();
    if (!sp || ["dismissed", "rejected", "pending"].includes(String(sp.application_status))) return json(403, { error: "Staff only" });
  }

  let postId: string | null = null;
  try { postId = ((await req.json()) as { postId?: string })?.postId ?? null; } catch { /* no body */ }
  if (mode === "user" && !postId) return json(400, { error: "postId is required" });
  if (postId && !/^[0-9a-f-]{36}$/i.test(postId)) return json(400, { error: "Invalid postId" });

  const summary = { checked: 0, published: 0, failed: 0, started: 0 };
  const headers = { "x-api-key": apiKey, "Content-Type": "application/json" };

  // --- 1. check posts that were already sent to the provider ---
  const { data: inFlight } = await admin.from("postit_posts").select("id, request_id, updated_at").eq("status", "publishing").limit(50);
  for (const p of inFlight ?? []) {
    if (!p.request_id) continue;
    summary.checked++;
    try {
      const res = await fetch(predictionUrl(p.request_id), { headers });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const out = interpretPrediction(await res.json());
      if (out.state === "published") {
        await admin.from("postit_posts").update({ status: "published", published_at: new Date().toISOString(), published_url: out.url, error: null }).eq("id", p.id).eq("status", "publishing");
        summary.published++;
      } else if (out.state === "failed") {
        await admin.from("postit_posts").update({ status: "failed", error: out.error }).eq("id", p.id).eq("status", "publishing");
        summary.failed++;
      } else if (Date.now() - new Date(p.updated_at).getTime() > PUBLISHING_TIMEOUT_MS) {
        await admin.from("postit_posts").update({ status: "failed", error: "No confirmation from the network after 30 minutes. Check the account and retry." }).eq("id", p.id).eq("status", "publishing");
        summary.failed++;
      }
    } catch (e) {
      console.error("postit-publish: status check failed", p.id, e instanceof Error ? e.message : e);
    }
  }

  // --- 2. send due posts ---
  let q = admin.from("postit_posts").select("*").eq("publish_mode", "auto");
  q = postId ? q.eq("id", postId).in("status", ["scheduled", "failed"]) : q.eq("status", "scheduled").lte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(20);
  const { data: due, error: dueErr } = await q;
  if (dueErr) return json(500, { error: dueErr.message });
  if (postId && (due ?? []).length === 0) return json(409, { error: "This post isn't set to auto-publish, or it was already sent.", ...summary });

  for (const post of due ?? []) {
    // Claim it so two overlapping runs never publish the same post twice.
    const { data: claimed } = await admin.from("postit_posts").update({ status: "publishing", error: null }).eq("id", post.id).in("status", ["scheduled", "failed"]).select("id").maybeSingle();
    if (!claimed) continue;

    const fail = async (message: string) => {
      await admin.from("postit_posts").update({ status: "failed", error: message }).eq("id", post.id);
      summary.failed++;
    };
    try {
      const { data: account } = post.account_id ? await admin.from("postit_accounts").select("external_account_id, status").eq("id", post.account_id).maybeSingle() : { data: null };
      if (account?.status === "disconnected") { await fail("The account is paused. Resume it, then retry."); continue; }
      const built = buildPublishRequest(post, account?.external_account_id);
      if ("error" in built) { await fail(built.error); continue; }
      const res = await fetch(built.url, { method: "POST", headers, body: JSON.stringify(built.body) });
      const text = await res.text();
      if (!res.ok) { await fail(`Publishing service refused it (${res.status}): ${text.slice(0, 300)}`); continue; }
      let requestId: string | null = null;
      try { const j = JSON.parse(text); requestId = j.request_id ?? j.id ?? null; } catch { /* ignore */ }
      if (!requestId) { await fail("The publishing service didn't return a request id."); continue; }
      await admin.from("postit_posts").update({ request_id: String(requestId) }).eq("id", post.id);
      summary.started++;
    } catch (e) {
      await fail(`Couldn't reach the publishing service: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  return json(200, { ok: true, mode, ...summary });
});
