-- Add new fields to staff_profiles
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS govt_id_number TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS staff_id_number TEXT;

-- Create a unique constraint for staff_id_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_staff_id_number ON staff_profiles(staff_id_number);

-- Function to auto-generate staff_id_number if it's null
CREATE OR REPLACE FUNCTION generate_staff_id_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_val INTEGER;
BEGIN
    IF NEW.staff_id_number IS NULL THEN
        -- Simple sequence-like generation (VAW-001, VAW-002, etc.)
        SELECT COALESCE(MAX(SUBSTRING(staff_id_number FROM 5)::INTEGER), 0) + 1
        INTO v_next_val
        FROM staff_profiles
        WHERE staff_id_number LIKE 'VAW-%';
        
        NEW.staff_id_number := 'VAW-' || LPAD(v_next_val::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate staff_id_number
DROP TRIGGER IF EXISTS tr_generate_staff_id_number ON staff_profiles;
CREATE TRIGGER tr_generate_staff_id_number
BEFORE INSERT ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION generate_staff_id_number();
