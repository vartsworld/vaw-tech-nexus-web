-- Refresh PostgREST schema cache to pick up all columns
NOTIFY pgrst, 'reload schema';