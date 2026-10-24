-- Dismissal record for staff. HR can "dismiss" an employee with a written reason instead of deleting the profile.
alter table public.staff_profiles
  add column if not exists dismissed_at timestamptz,
  add column if not exists dismissed_by uuid,
  add column if not exists dismissal_reason text;

comment on column public.staff_profiles.dismissal_reason is 'Reason entered by HR when the employee was dismissed';
