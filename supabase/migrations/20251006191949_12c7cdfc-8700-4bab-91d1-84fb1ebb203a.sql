-- Add earnings column to staff_profiles
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS earnings DECIMAL(10, 2) DEFAULT 0.00;