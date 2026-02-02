-- Create workspace_layouts table to store user workspace configurations
CREATE TABLE public.workspace_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  layout_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_layouts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own workspace layouts
CREATE POLICY "Users can manage their own workspace layouts" 
ON public.workspace_layouts 
FOR ALL 
USING ((user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))
WITH CHECK ((user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_workspace_layouts_updated_at
BEFORE UPDATE ON public.workspace_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();