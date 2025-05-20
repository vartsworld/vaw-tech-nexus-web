
import { Database } from "@/integrations/supabase/types";

// Utility type to get a table's Row type
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Type definitions for specific tables
export type Inquiry = TableRow<'inquiries'>;
export type ServiceRequest = TableRow<'service_requests'>;
export type Project = TableRow<'projects'>;
export type Testimonial = TableRow<'testimonials'>;
export type Partner = TableRow<'partners'>;

// Type guard functions
export function isInquiry(obj: any): obj is Inquiry {
  return obj && typeof obj === 'object' 
    && typeof obj.name === 'string'
    && typeof obj.email === 'string' 
    && typeof obj.message === 'string';
}

export function isServiceRequest(obj: any): obj is ServiceRequest {
  return obj && typeof obj === 'object'
    && typeof obj.full_name === 'string'
    && typeof obj.email === 'string'
    && Array.isArray(obj.services);
}

export function isProject(obj: any): obj is Project {
  return obj && typeof obj === 'object'
    && typeof obj.title === 'string'
    && typeof obj.category === 'string'
    && typeof obj.description === 'string';
}

export function isTestimonial(obj: any): obj is Testimonial {
  return obj && typeof obj === 'object'
    && typeof obj.client_name === 'string'
    && typeof obj.message === 'string'
    && typeof obj.rating === 'number';
}
