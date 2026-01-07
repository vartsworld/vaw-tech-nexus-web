-- FIXED ORDER MIGRATION: 1. Function, 2. Policies
-- This ensures 'is_hr' exists before policies try to use it.

-- 1. Create/Update the Helper Function FIRST
CREATE OR REPLACE FUNCTION public.is_hr(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- We query role directly. Since this is SECURITY DEFINER, if owned by postgres, it bypasses RLS.
  -- We use a direct check to avoid recursion with the table's own policies if possible,
  -- but strictly speaking, the recursion happens if the policy on the table calls this function, 
  -- and this function selects from the table, triggering the policy again.
  -- To break the loop, the SELECT policy on staff_profiles MUST NOT use is_hr().
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles 
    WHERE user_id = _user_id AND role = 'hr'
  );
$$;

-- 2. Clean up the Recursive Policy
DROP POLICY IF EXISTS "HR can manage all profiles" ON public.staff_profiles;
DROP POLICY IF EXISTS "HR can manage profiles (write)" ON public.staff_profiles; -- Cleanup previous attempts
DROP POLICY IF EXISTS "HR can update profiles" ON public.staff_profiles;
DROP POLICY IF EXISTS "HR can delete profiles" ON public.staff_profiles;

-- 3. Define Non-Recursive READ Policy
-- CRITICAL: This policy must NOT use is_hr(). It must be open or based on `auth.uid() = user_id`.
-- "Users can view all profiles" with (true) is safe.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.staff_profiles;
CREATE POLICY "Users can view all profiles" 
ON public.staff_profiles FOR SELECT 
USING (true);

-- 4. Define WRITE Policies for HR (using the function is safe here because these are for INSERT/UPDATE/DELETE, not SELECT)
-- The Recursion loop usually happens on SELECT because checking the policy requires Reading (SELECTing) the row, which triggers the policy...
-- For INSERT/UPDATE, we can check the role.

CREATE POLICY "HR can insert profiles" 
ON public.staff_profiles
FOR INSERT 
WITH CHECK (public.is_hr(auth.uid()));

CREATE POLICY "HR can update profiles" 
ON public.staff_profiles
FOR UPDATE
USING (public.is_hr(auth.uid()));

CREATE POLICY "HR can delete profiles" 
ON public.staff_profiles
FOR DELETE
USING (public.is_hr(auth.uid()));

-- 5. Grant execute permissions just in case
GRANT EXECUTE ON FUNCTION public.is_hr(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr(uuid) TO anon;
