-- Create task feedback forms table
CREATE TABLE IF NOT EXISTS public.task_feedback_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.staff_tasks(id) ON DELETE CASCADE,
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    questions JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create task feedback responses table
CREATE TABLE IF NOT EXISTS public.task_feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES public.task_feedback_forms(id) ON DELETE CASCADE,
    responses JSONB DEFAULT '{}',
    client_info JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_feedback_forms_task_id ON public.task_feedback_forms(task_id);
CREATE INDEX IF NOT EXISTS idx_task_feedback_forms_token ON public.task_feedback_forms(token);
CREATE INDEX IF NOT EXISTS idx_task_feedback_responses_form_id ON public.task_feedback_responses(form_id);

-- Enable RLS
ALTER TABLE public.task_feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_feedback_responses ENABLE ROW LEVEL SECURITY;

-- Policies for task_feedback_forms
-- Everyone can read a form if they have the token (for public submission)
CREATE POLICY "Public can read feedback form by token" ON public.task_feedback_forms
    FOR SELECT USING (true);

-- Authenticated staff can manage forms
CREATE POLICY "Staff can manage feedback forms" ON public.task_feedback_forms
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for task_feedback_responses
-- Anyone can insert a response (public submission)
CREATE POLICY "Public can insert feedback responses" ON public.task_feedback_responses
    FOR INSERT WITH CHECK (true);

-- Staff can view responses
CREATE POLICY "Staff can view feedback responses" ON public.task_feedback_responses
    FOR SELECT USING (auth.role() = 'authenticated');
