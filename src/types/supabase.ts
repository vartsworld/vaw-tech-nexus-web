
import { Database } from "@/integrations/supabase/types";

// Utility type to get a table's Row type
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Type definitions for specific tables
export type Inquiry = TableRow<'inquiries'>;
export type ServiceRequest = TableRow<'service_requests'>;

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
