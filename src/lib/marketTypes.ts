// Row types for the marketing-site tables (`market_*`, see supabase/migrations/20261025000000_marketing_site_market_tables.sql).
// They are not in the generated Supabase types yet; regenerate types after applying the migration.

export interface MarketEnquiry {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  budget: string | null;
  message: string | null;
  source: string;
  privacy_acknowledged_at: string | null;
  status: string;
  assigned_to: string | null;
  notes: string | null;
}

export interface MarketPlanQuote {
  id: string;
  created_at: string;
  plan_id: string;
  billing_cycle: "monthly" | "yearly";
  videos: number;
  posters: number;
  extra_on_location_sessions: number;
  personal_branding: boolean;
  dubbing_languages: number;
  seo_tier: string;
  selected_platforms: unknown;
  community_tier: string;
  ads_tier: string;
  include_website: boolean;
  social_media_management: boolean;
  monthly_total: number | null;
  yearly_total: number | null;
  website_one_time: number | null;
  website_annual_renewal: number | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  notes: string | null;
}

export interface MarketProject {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  brand_label: string;
  title: string;
  tagline: string;
  client: string;
  category: string;
  year: string;
  description: string;
  metric: string;
  metric_label: string;
  metric_verified: boolean;
  tags: unknown;
  image_url: string;
  deliverables: unknown;
  featured: boolean;
  published: boolean;
  sort_order: number;
}

export interface MarketBlogPost {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  cover_image: string;
  author: string;
  author_role: string;
  category: string;
  tags: unknown;
  reading_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  published_at: string | null;
}

export interface MarketTestimonial {
  id: string;
  created_at: string;
  quote: string;
  author_name: string;
  author_role: string;
  company: string;
  consent_received_at: string | null;
  published: boolean;
  sort_order: number;
}

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New", tone: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  { value: "contacted", label: "Contacted", tone: "border-sky-500/30 bg-sky-500/10 text-sky-400" },
  { value: "meeting_scheduled", label: "Meeting scheduled", tone: "border-violet-500/30 bg-violet-500/10 text-violet-400" },
  { value: "in_progress", label: "In progress", tone: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  { value: "converted", label: "Converted", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { value: "closed", label: "Closed", tone: "border-white/15 bg-white/5 text-muted-foreground" },
] as const;

export const enquiryStatusMeta = (value: string) => ENQUIRY_STATUSES.find((s) => s.value === value) ?? ENQUIRY_STATUSES[0];

/** jsonb columns hold string arrays; be forgiving about what comes back. */
export const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim()) : [];

export const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
