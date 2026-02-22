
-- Task templates linked to pricing packages
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES public.pricing_packages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  points INTEGER DEFAULT 10,
  trial_period BOOLEAN DEFAULT false,
  estimated_days INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subtask templates linked to task templates
CREATE TABLE public.subtask_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtask_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can read, HR/admin can manage
CREATE POLICY "Authenticated users can view task templates"
  ON public.task_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage task templates"
  ON public.task_templates FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view subtask templates"
  ON public.subtask_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage subtask templates"
  ON public.subtask_templates FOR ALL
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_task_templates_package ON public.task_templates(package_id);
CREATE INDEX idx_subtask_templates_task ON public.subtask_templates(task_template_id);
