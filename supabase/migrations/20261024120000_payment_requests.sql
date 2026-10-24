-- Payment links created from website requests via the VAW Pay gateway (/upi).
-- Rows are written only by the `vaw-pay-create` and `vaw-pay-webhook` edge functions (service role).
-- HR and super admins can read them.

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.inquiries(id) on delete cascade,
  order_id text not null unique,
  gateway_payment_id text unique,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR',
  checkout_url text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  utr text,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_requests_inquiry_idx on public.payment_requests (inquiry_id, created_at desc);

alter table public.payment_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_requests' and policyname = 'HR and admins can view payment requests'
  ) then
    create policy "HR and admins can view payment requests"
      on public.payment_requests
      for select
      using (
        exists (
          select 1 from public.staff_profiles
          where user_id = auth.uid() and (role = 'hr' or role = 'super_admin')
        )
      );
  end if;
end $$;

-- Live updates for the HR dashboard.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payment_requests'
  ) then
    alter publication supabase_realtime add table public.payment_requests;
  end if;
end $$;
