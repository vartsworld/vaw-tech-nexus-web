-- Add Facebook token renewal columns to project_monitors
ALTER TABLE public.project_monitors 
ADD COLUMN facebook_token_renewal_date date,
ADD COLUMN facebook_token_renewal_cycle text DEFAULT '90days';