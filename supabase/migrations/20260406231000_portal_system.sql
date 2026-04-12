-- Update qr_redirections table to link to clients and mark as portal
alter table qr_redirections add column if not exists client_id uuid references client_profiles(id);
alter table qr_redirections add column if not exists is_portal boolean default false;

-- Create portal_links table
create table if not exists portal_links (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references client_profiles(id) on delete cascade not null,
  title text not null,
  description text,
  url text not null,
  icon text,
  page_id text,
  password text,
  category text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for portal_links
alter table portal_links enable row level security;

-- Policy for HR and Super Admin to manage portal links
create policy "Allow HR and Super Admin to manage portal links"
  on portal_links
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

-- Policy for public to read portal links (needed for the portal page)
create policy "Allow public to read portal links"
  on portal_links
  for select
  to public
  using (is_active = true);

-- Trigger for portal_links updated_at
create trigger update_portal_links_updated_at
before update on portal_links
for each row
execute function update_updated_at_column();
