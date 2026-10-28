import { addDays, addHours, format, isBefore, nextMonday, set, startOfDay } from "date-fns";
import { platformInfo } from "./platforms";
import type { PlatformKey, PostStatus, PostitPost } from "./types";

export const STATUS_META: Record<PostStatus, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "border-white/15 bg-white/5 text-muted-foreground" },
  scheduled: { label: "Scheduled", tone: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  publishing: { label: "Publishing", tone: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  published: { label: "Posted", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  failed: { label: "Failed", tone: "border-red-500/30 bg-red-500/10 text-red-400" },
};

/** "#a #b" form used when publishing. */
export const hashtagLine = (tags: string[]) => tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");

/** The text that will actually be posted: caption plus hashtags. */
export const fullText = (caption: string, hashtags: string[]) => [caption.trim(), hashtagLine(hashtags)].filter(Boolean).join("\n\n");

export const textLength = (caption: string, hashtags: string[]) => Array.from(fullText(caption, hashtags)).length;

/** Splits "#a, b  #c" into clean unique tags without the leading #. */
export const parseHashtags = (raw: string): string[] => {
  const seen = new Set<string>();
  raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, ""))
    .filter(Boolean)
    .forEach((t) => seen.add(t));
  return [...seen];
};

export const mediaKind = (url: string): "image" | "video" =>
  /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url) ? "video" : "image";

export const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

/** A scheduled post whose time has come. Manual ones are waiting for a person to post them. */
export const isDue = (p: Pick<PostitPost, "status" | "scheduled_at">, now = new Date()) =>
  p.status === "scheduled" && !!p.scheduled_at && new Date(p.scheduled_at) <= now;

export const postDate = (p: Pick<PostitPost, "scheduled_at" | "published_at">): Date | null =>
  p.scheduled_at ? new Date(p.scheduled_at) : p.published_at ? new Date(p.published_at) : null;

export const toLocalInput = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");
export const fromLocalInput = (v: string) => (v ? new Date(v) : null);

/** Sensible default slot for a clicked day: 9:00 for future days, an hour from now for today. */
export const defaultSlot = (day: Date, now = new Date()): Date => {
  const nine = set(day, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
  if (startOfDay(day).getTime() === startOfDay(now).getTime() || isBefore(nine, now)) {
    // The next half hour that is at least 30 minutes away.
    const t = new Date(now.getTime() + 30 * 60_000);
    t.setSeconds(0, 0);
    t.setMinutes(t.getMinutes() <= 30 ? 30 : 60);
    return t;
  }
  return nine;
};

export const quickSlots = (now = new Date()) => [
  { label: "In 1 hour", date: addHours(now, 1) },
  { label: "Tomorrow 9 AM", date: set(addDays(now, 1), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }) },
  { label: "Next Monday 9 AM", date: set(nextMonday(now), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }) },
];

export interface PostIssue {
  level: "error" | "warn";
  message: string;
}

/** Checks one platform's version of a post. Errors block scheduling; warnings are shown but allowed. */
export const checkPost = (opts: {
  platform: PlatformKey;
  caption: string;
  hashtags: string[];
  title: string;
  media: string[];
  mode: "manual" | "auto";
  externalAccountId?: string | null;
}): PostIssue[] => {
  const info = platformInfo(opts.platform);
  const issues: PostIssue[] = [];
  const len = textLength(opts.caption, opts.hashtags);
  if (len > info.charLimit) issues.push({ level: "error", message: `${info.name}: ${len - info.charLimit} characters over the ${info.charLimit.toLocaleString()} limit.` });
  if (!opts.caption.trim() && opts.media.length === 0) issues.push({ level: "error", message: `${info.name}: add a caption or media.` });
  if (info.mediaRequired && opts.media.length === 0) issues.push({ level: "error", message: `${info.name}: ${info.mediaTypes.length === 1 ? "a video is" : "an image or video is"} required.` });
  if (opts.media.length > 0 && !opts.media.some((m) => info.mediaTypes.includes(mediaKind(m)))) {
    issues.push({ level: "error", message: `${info.name} accepts ${info.mediaTypes.join(" or ")} only.` });
  }
  if (info.hasTitle && !opts.title.trim()) issues.push({ level: "error", message: `${info.name}: a title is required.` });
  if (opts.mode === "auto") {
    if (!opts.externalAccountId) issues.push({ level: "error", message: `${info.name}: auto-publish needs a connected account with a provider account ID.` });
    if (opts.media.length === 0) issues.push({ level: "error", message: `${info.name}: auto-publish needs media.` });
    if (opts.media.length > 1) issues.push({ level: "warn", message: `${info.name}: auto-publish sends only the first file.` });
  }
  return issues;
};
