
// Partner type definitions for the application
export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  industry: string | null;
  description: string | null;
  featured: boolean;
  website_url: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}
