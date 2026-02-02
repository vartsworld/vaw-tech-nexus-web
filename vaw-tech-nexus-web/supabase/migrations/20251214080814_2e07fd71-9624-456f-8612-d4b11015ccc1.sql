-- Add renewal cycle columns to project_monitors
ALTER TABLE public.project_monitors 
ADD COLUMN domain_renewal_cycle text DEFAULT 'yearly',
ADD COLUMN server_renewal_cycle text DEFAULT 'yearly';