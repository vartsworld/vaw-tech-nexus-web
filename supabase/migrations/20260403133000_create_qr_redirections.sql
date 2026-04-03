-- Create qr_redirections table
create table if not exists qr_redirections (
  id uuid default gen_random_uuid() primary key,
  qr_id text unique not null,
  target_url text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table qr_redirections enable row level security;

-- Policy for HR and Super Admin to manage
create policy "Allow HR and Super Admin to manage QR redirections"
  on qr_redirections
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

-- Policy for public to read (needed for redirection)
create policy "Allow public to read QR redirections"
  on qr_redirections
  for select
  to public
  using (true);

-- Function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_qr_redirections_updated_at
before update on qr_redirections
for each row
execute function update_updated_at_column();
