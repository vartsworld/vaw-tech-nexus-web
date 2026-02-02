-- Create table for intern experience sharing and feedback
CREATE TABLE public.intern_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intern_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  internship_domain TEXT NOT NULL,
  experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
  overall_experience TEXT NOT NULL,
  skills_learned TEXT,
  project_highlights TEXT,
  mentor_feedback TEXT,
  suggestions_for_improvement TEXT,
  would_recommend BOOLEAN DEFAULT true,
  certificate_requested BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'submitted'
);

-- Create table for team application requests
CREATE TABLE public.team_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  current_position TEXT,
  experience_years INTEGER,
  skills TEXT NOT NULL,
  why_join_team TEXT NOT NULL,
  preferred_role TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE public.intern_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for intern_experiences
CREATE POLICY "Anyone can submit intern experiences" 
ON public.intern_experiences 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all intern experiences" 
ON public.intern_experiences 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update intern experience status" 
ON public.intern_experiences 
FOR UPDATE 
USING (true);

-- Create policies for team_applications
CREATE POLICY "Anyone can submit team applications" 
ON public.team_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all team applications" 
ON public.team_applications 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update team application status" 
ON public.team_applications 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_intern_experiences_updated_at
BEFORE UPDATE ON public.intern_experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_applications_updated_at
BEFORE UPDATE ON public.team_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();