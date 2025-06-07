// Custom type definitions for our database tables
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_position: string | null;
  client_company: string | null;
  message: string;
  rating: number;
  image_url: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  industry?: string | null;
  description?: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  full_name: string;
  company_name: string | null;
  phone_number: string;
  email: string;
  date_of_birth: string | null;
  services: string[];
  address_line1: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  logo_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  course: string;
  graduation_year: string;
  domains: string[];
  cover_letter: string;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
}
