import type { PlatformKey } from "./types";

export interface PlatformInfo {
  key: PlatformKey;
  name: string;
  /** 1-2 letter mark for compact badges */
  mark: string;
  /** Brand colour used for badges and calendar chips */
  color: string;
  charLimit: number;
  mediaTypes: ("image" | "video")[];
  /** The network can't publish without an image or video */
  mediaRequired: boolean;
  hasTitle: boolean;
  /** Pinterest pins link to a destination URL */
  hasLink: boolean;
  /** Where staff go to post by hand */
  composeUrl: string;
  hint: string;
}

// Limits follow the defaults used by the postiz-cheap project (MIT) this feature was modelled on.
// Networks can apply stricter, account-specific rules.
export const PLATFORMS: PlatformInfo[] = [
  { key: "instagram", name: "Instagram", mark: "IG", color: "#e1306c", charLimit: 2200, mediaTypes: ["image", "video"], mediaRequired: true, hasTitle: false, hasLink: false, composeUrl: "https://www.instagram.com/", hint: "Needs an image or video. Links in captions aren't clickable." },
  { key: "facebook", name: "Facebook", mark: "FB", color: "#1877f2", charLimit: 63206, mediaTypes: ["image", "video"], mediaRequired: false, hasTitle: false, hasLink: true, composeUrl: "https://business.facebook.com/latest/composer", hint: "Text, image or video." },
  { key: "linkedin", name: "LinkedIn", mark: "in", color: "#0a66c2", charLimit: 3000, mediaTypes: ["image", "video"], mediaRequired: false, hasTitle: false, hasLink: true, composeUrl: "https://www.linkedin.com/feed/", hint: "Text, image or video." },
  { key: "x_twitter", name: "X (Twitter)", mark: "X", color: "#8b98a5", charLimit: 280, mediaTypes: ["image", "video"], mediaRequired: false, hasTitle: false, hasLink: true, composeUrl: "https://x.com/compose/post", hint: "280 characters including hashtags." },
  { key: "youtube", name: "YouTube", mark: "YT", color: "#ff0000", charLimit: 5000, mediaTypes: ["video"], mediaRequired: true, hasTitle: true, hasLink: false, composeUrl: "https://studio.youtube.com/", hint: "Needs a video and a title." },
  { key: "tiktok", name: "TikTok", mark: "TT", color: "#25f4ee", charLimit: 2200, mediaTypes: ["video"], mediaRequired: true, hasTitle: false, hasLink: false, composeUrl: "https://www.tiktok.com/upload", hint: "Needs a video." },
  { key: "threads", name: "Threads", mark: "Th", color: "#a78bfa", charLimit: 500, mediaTypes: ["image", "video"], mediaRequired: false, hasTitle: false, hasLink: true, composeUrl: "https://www.threads.net/", hint: "500 characters." },
  { key: "pinterest", name: "Pinterest", mark: "Pi", color: "#e60023", charLimit: 500, mediaTypes: ["image", "video"], mediaRequired: true, hasTitle: true, hasLink: true, composeUrl: "https://www.pinterest.com/pin-creation-tool/", hint: "Needs an image or video and a title; the link is the pin's destination." },
];

export const PLATFORM_BY_KEY: Record<PlatformKey, PlatformInfo> = Object.fromEntries(PLATFORMS.map((p) => [p.key, p])) as Record<PlatformKey, PlatformInfo>;

export const platformInfo = (key: string): PlatformInfo =>
  PLATFORM_BY_KEY[key as PlatformKey] ?? { ...PLATFORMS[0], key: key as PlatformKey, name: key, mark: key.slice(0, 2).toUpperCase(), color: "#94a3b8" };
