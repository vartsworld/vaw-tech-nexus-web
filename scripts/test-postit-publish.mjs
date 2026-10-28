// Contract test for the Post Scheduler's pure publishing helpers.  Run: node scripts/test-postit-publish.mjs
import assert from "node:assert/strict";
import { buildCaption, buildPublishRequest, interpretPrediction, predictionUrl, PUBLISH_ENDPOINTS } from "../supabase/functions/_shared/postit.ts";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok  ", name); };
const post = (o = {}) => ({ platform: "instagram", title: "", caption: "Hello world", hashtags: ["launch", "#sale"], media_urls: ["https://x.test/a.mp4"], link_url: null, ...o });

t("caption joins text and normalised hashtags", () => assert.equal(buildCaption("Hi", ["a", "#b"]), "Hi\n\n#a #b"));
t("caption with no hashtags has no trailing blank", () => assert.equal(buildCaption(" Hi ", []), "Hi"));
t("hashtags only", () => assert.equal(buildCaption("", ["a"]), "#a"));
t("every platform has an endpoint", () => assert.equal(Object.keys(PUBLISH_ENDPOINTS).length, 8));
t("missing account id is refused", () => assert.ok("error" in buildPublishRequest(post(), null)));
t("missing media is refused", () => assert.ok("error" in buildPublishRequest(post({ media_urls: [] }), "12")));
t("non-http media is ignored", () => assert.ok("error" in buildPublishRequest(post({ media_urls: ["javascript:alert(1)", "data:x"] }), "12")));
t("numeric account ids are sent as numbers", () => assert.equal(buildPublishRequest(post(), "42").body.account_id, 42));
t("non-numeric account ids stay strings", () => assert.equal(buildPublishRequest(post(), "acc_9").body.account_id, "acc_9"));
t("instagram video uses reels", () => { const r = buildPublishRequest(post(), "1"); assert.equal(r.body.placement, "reels"); assert.match(r.body.caption, /#launch #sale/); });
t("instagram image sends no placement", () => assert.equal(buildPublishRequest(post({ media_urls: ["https://x.test/a.jpg"] }), "1").body.placement, undefined));
t("x is cut to 280 characters", () => assert.equal(buildPublishRequest(post({ platform: "x_twitter", caption: "a".repeat(400) }), "1").body.caption.length, 280));
t("threads is cut to 500 characters", () => assert.equal(buildPublishRequest(post({ platform: "threads", caption: "a".repeat(900) }), "1").body.caption.length, 500));
t("youtube title falls back to first line", () => { const b = buildPublishRequest(post({ platform: "youtube", caption: "First line\nrest" }), "1").body; assert.equal(b.title, "First line"); assert.deepEqual(b.tags, ["launch", "sale"]); });
t("youtube explicit title wins", () => assert.equal(buildPublishRequest(post({ platform: "youtube", title: "My title" }), "1").body.title, "My title"));
t("pinterest carries destination link", () => assert.equal(buildPublishRequest(post({ platform: "pinterest", title: "Pin", link_url: "https://site.test" }), "1").body.destination_link, "https://site.test"));
t("endpoint matches platform", () => assert.equal(buildPublishRequest(post({ platform: "tiktok" }), "1").url, PUBLISH_ENDPOINTS.tiktok));
t("prediction url escapes the id", () => assert.equal(predictionUrl("a/b"), "https://api.muapi.ai/api/v1/predictions/a%2Fb/result"));
t("completed -> published with url", () => assert.deepEqual(interpretPrediction({ status: "completed", output: { url: "https://i.test/p/1" } }).url, "https://i.test/p/1"));
t("succeeded via outputs[] with platform url", () => assert.equal(interpretPrediction({ state: "succeeded", outputs: [{ instagram_url: "https://ig.test/p" }] }).url, "https://ig.test/p"));
t("published with unsafe url drops the url", () => assert.equal(interpretPrediction({ status: "completed", output: { url: "javascript:alert(1)" } }).url, null));
t("failed carries the message", () => assert.deepEqual(interpretPrediction({ status: "failed", error: "token expired" }), { state: "failed", error: "token expired" }));
t("failed object error", () => assert.equal(interpretPrediction({ status: "failed", error: { message: "bad" } }).error, "bad"));
t("failed without message has a default", () => assert.ok(interpretPrediction({ status: "failed" }).error.length > 5));
t("unknown or missing status keeps waiting", () => { assert.equal(interpretPrediction({ status: "processing" }).state, "processing"); assert.equal(interpretPrediction(null).state, "processing"); });

console.log(`\n${n} passed`);
