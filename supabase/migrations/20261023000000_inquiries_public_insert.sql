-- Inquiries (contact form, pricing requests, custom requests)
-- Idempotent: safe to run on a database where the table already exists.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service text,
  message text not null,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Allow website visitors (anon key) to submit an inquiry, but only as a new lead
-- with sane field lengths. Read / update / delete stay governed by existing policies.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inquiries' and policyname = 'Website visitors can submit inquiries'
  ) then
    create policy "Website visitors can submit inquiries"
      on public.inquiries
      for insert
      to anon, authenticated
      with check (
        coalesce(status, 'new') = 'new'
        and char_length(name) between 1 and 200
        and char_length(email) between 3 and 255
        and char_length(message) between 1 and 6000
      );
  end if;
end $$;
