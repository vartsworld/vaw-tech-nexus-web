// Row types for the Post Scheduler tables (`postit_*`, see supabase/migrations/20261026000000_post_scheduler.sql).
// They are not in the generated Supabase types yet; regenerate the types after applying the migration.

export type PlatformKey = "youtube" | "tiktok" | "instagram" | "x_twitter" | "facebook" | "linkedin" | "threads" | "pinterest";
export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type PublishMode = "manual" | "auto";

export interface PostitAccount {
  id: string;
  created_at: string;
  updated_at: string;
  /** null = VAW Technologies' own pages */
  client_id: string | null;
  platform: PlatformKey;
  account_name: string;
  handle: string | null;
  profile_url: string | null;
  external_account_id: string | null;
  status: "active" | "disconnected";
  created_by: string | null;
}

export interface PostitPost {
  id: string;
  created_at: string;
  updated_at: string;
  group_id: string;
  client_id: string | null;
  account_id: string | null;
  platform: PlatformKey;
  title: string;
  caption: string;
  hashtags: string[];
  media_urls: string[];
  link_url: string | null;
  scheduled_at: string | null;
  status: PostStatus;
  publish_mode: PublishMode;
  published_at: string | null;
  published_url: string | null;
  request_id: string | null;
  error: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface ClientLite {
  id: string;
  company_name: string;
}

/** Special client filter values */
export const ALL_CLIENTS = "all";
export const INTERNAL_CLIENT = "internal";
