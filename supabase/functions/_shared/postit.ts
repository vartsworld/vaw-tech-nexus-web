// Pure helpers for the Post Scheduler's optional auto-publishing (no Deno or Supabase imports, so they
// can be tested with plain Node, see scripts/test-postit-publish.mjs).
//
// Publishing goes through MuAPI (https://muapi.ai), the same provider the open-source postiz-cheap project
// uses. Request shapes below follow that project; they have NOT been exercised against the live service.

export type PlatformKey = "youtube" | "tiktok" | "instagram" | "x_twitter" | "facebook" | "linkedin" | "threads" | "pinterest";

export interface PostRow {
  platform: PlatformKey;
  title: string | null;
  caption: string | null;
  hashtags: string[] | null;
  media_urls: unknown;
  link_url?: string | null;
}

const BASE = "https://api.muapi.ai/api/v1";
export const PUBLISH_ENDPOINTS: Record<PlatformKey, string> = {
  youtube: `${BASE}/youtube-publish`,
  tiktok: `${BASE}/tiktok-publish`,
  instagram: `${BASE}/instagram-publish`,
  x_twitter: `${BASE}/x-publish`,
  facebook: `${BASE}/facebook-publish`,
  linkedin: `${BASE}/linkedin-publish`,
  threads: `${BASE}/threads-publish`,
  pinterest: `${BASE}/pinterest-publish`,
};

export const predictionUrl = (requestId: string) => `${BASE}/predictions/${encodeURIComponent(requestId)}/result`;

const hashtagLine = (tags: string[]) => tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");

/** Caption plus hashtags, as it should appear on the network. */
export const buildCaption = (caption: string | null, hashtags: string[] | null): string =>
  [String(caption ?? "").trim(), hashtagLine((hashtags ?? []).filter(Boolean))].filter(Boolean).join("\n\n");

const firstMedia = (media: unknown): string | null =>
  Array.isArray(media) ? (media.find((m) => typeof m === "string" && /^https?:\/\//.test(m)) as string | undefined) ?? null : null;

const isVideoUrl = (u: string) => /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(u);

/** Builds the provider request for a post, or explains why it can't be published automatically. */
export const buildPublishRequest = (post: PostRow, externalAccountId: string | null | undefined): { url: string; body: Record<string, unknown> } | { error: string } => {
  if (!externalAccountId) return { error: "The account has no provider account ID, so it can't be auto-published." };
  const media = firstMedia(post.media_urls);
  if (!media) return { error: "Auto-publishing needs an image or video link." };
  const url = PUBLISH_ENDPOINTS[post.platform];
  if (!url) return { error: `Auto-publishing isn't supported for ${post.platform}.` };

  const idNum = Number(externalAccountId);
  const body: Record<string, unknown> = { account_id: Number.isFinite(idNum) && /^\d+$/.test(externalAccountId) ? idNum : externalAccountId, media_url: media };
  const text = buildCaption(post.caption, post.hashtags);
  const tags = (post.hashtags ?? []).map((t) => t.replace(/^#/, ""));

  switch (post.platform) {
    case "youtube":
      body.title = (post.title || "").trim() || text.split("\n")[0].slice(0, 100) || "Untitled video";
      body.description = String(post.caption ?? "");
      body.tags = tags;
      body.privacy = "public";
      body.made_for_kids = false;
      break;
    case "tiktok":
      body.title = text.slice(0, 2200);
      body.privacy_level = "PUBLIC_TO_EVERYONE";
      body.disable_comment = false;
      body.disable_duet = false;
      body.disable_stitch = false;
      break;
    case "instagram":
      body.caption = text.slice(0, 2200);
      if (isVideoUrl(media)) { body.placement = "reels"; body.share_to_feed = true; }
      break;
    case "x_twitter":
      body.caption = text.slice(0, 280);
      body.reply_settings = "everyone";
      break;
    case "facebook":
      body.caption = text;
      body.placement = "timeline";
      break;
    case "linkedin":
      body.caption = text;
      break;
    case "threads":
      body.caption = text.slice(0, 500);
      body.placement = "timeline";
      break;
    case "pinterest":
      body.title = (post.title || "").trim() || "Untitled Pin";
      body.caption = String(post.caption ?? "").trim() || text;
      if (post.link_url) body.destination_link = post.link_url;
      break;
  }
  return { url, body };
};

export type Outcome = { state: "processing" } | { state: "published"; url: string | null; raw: unknown } | { state: "failed"; error: string };

/** Interprets the provider's prediction/result response. */
export const interpretPrediction = (result: any): Outcome => {
  const status = String(result?.status ?? result?.state ?? "").toLowerCase();
  if (status === "completed" || status === "succeeded" || status === "success") {
    const output = result?.output ?? (Array.isArray(result?.outputs) ? result.outputs[0] : null) ?? {};
    const url = output?.url ?? output?.x_url ?? output?.instagram_url ?? output?.facebook_url ?? output?.linkedin_url ?? output?.threads_url ?? output?.pinterest_url ?? null;
    return { state: "published", url: typeof url === "string" && /^https?:\/\//.test(url) ? url : null, raw: output };
  }
  if (status === "failed" || status === "error" || status === "cancelled") {
    const e = result?.error;
    return { state: "failed", error: (typeof e === "string" ? e : e?.message) || "The network rejected the post." };
  }
  return { state: "processing" };
};

/** A post stuck in "publishing" this long is treated as failed so someone looks at it. */
export const PUBLISHING_TIMEOUT_MS = 30 * 60 * 1000;
