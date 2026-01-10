-- Create client_projects table properly if it doesn't exist or fix the relationship
CREATE TABLE IF NOT EXISTS public.client_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Force disable RLS on client_projects as per earlier instruction
ALTER TABLE public.client_projects DISABLE ROW LEVEL SECURITY;

-- If the table existed but with a different client column name or reference, we might need to fix it.
-- But since the error says "Could not find a relationship", it likely means the foreign key is missing or named differently
-- if the table was created under a different name or without the constraint.

-- Let's try to add the constraint explicitly just in case it's missing or named something else invisible
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'client_projects_client_id_fkey'
    ) THEN
        ALTER TABLE public.client_projects 
        ADD CONSTRAINT client_projects_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
END $$;
