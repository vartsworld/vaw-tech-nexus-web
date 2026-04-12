-- Create client_portals table to manage active portals
create table if not exists client_portals (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references client_profiles(id) on delete cascade unique not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table client_portals enable row level security;

-- Policy for HR and Super Admin
create policy "Allow HR and Super Admin to manage client portals"
  on client_portals
  for all
  to authenticated
  using (
    exists (
      select 1 from staff_profiles
      where user_id = auth.uid()
      and role in ('hr', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from staff_profiles
      where user_id = auth.uid()
      and role in ('hr', 'super_admin')
    )
  );

-- Policy for public to read
create policy "Allow public to read client portals"
  on client_portals
  for select
  to public
  using (is_active = true);

-- Update portal_links to reference client_portals instead?
-- Actually, referencing client_profiles directly is fine too, but let's keep it consistent.
-- The user said "select a client", so client_profiles(id) is the natural FK.

-- Trigger for client_portals updated_at
create trigger update_client_portals_updated_at
before update on client_portals
for each row
execute function update_updated_at_column();
