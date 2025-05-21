
// Partner type definitions for the application
export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  industry: string | null;
  description: string | null;
  featured: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}
