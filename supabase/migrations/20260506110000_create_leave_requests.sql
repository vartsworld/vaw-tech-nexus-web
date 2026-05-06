
-- Create staff_leave_requests table
CREATE TABLE IF NOT EXISTS public.staff_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own leave requests" ON public.staff_leave_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leave requests" ON public.staff_leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR and Admins can view all leave requests" ON public.staff_leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles
            WHERE user_id = auth.uid() AND (role = 'hr' OR role = 'super_admin')
        )
    );

CREATE POLICY "HR and Admins can update leave requests" ON public.staff_leave_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles
            WHERE user_id = auth.uid() AND (role = 'hr' OR role = 'super_admin')
        )
    );
