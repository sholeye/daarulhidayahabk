-- Run this migration on an existing Supabase project.
create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  session text not null,
  fee numeric(10,2) not null check (fee >= 0),
  is_current boolean not null default false,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, session)
);
create unique index if not exists academic_terms_one_current_idx on public.academic_terms (is_current) where is_current;

alter table public.payments add column if not exists term_id uuid references public.academic_terms(id) on delete set null;
alter table public.academic_terms enable row level security;

drop policy if exists "academic_terms_select_authenticated" on public.academic_terms;
create policy "academic_terms_select_authenticated" on public.academic_terms
for select to authenticated using (true);

drop policy if exists "academic_terms_manage_admin" on public.academic_terms;
create policy "academic_terms_manage_admin" on public.academic_terms
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

do $$
declare
  default_term_id uuid;
  default_fee numeric(10,2);
begin
  if not exists (select 1 from public.academic_terms where is_current) then
    select id into default_term_id
    from public.academic_terms
    where name = 'First Term' and session = '2024/2025'
    limit 1;

    if default_term_id is not null then
      update public.academic_terms set is_current = true where id = default_term_id;
    else
      select term_fee into default_fee from public.school_settings where id = 1;
      insert into public.academic_terms (name, session, fee, is_current)
      values ('First Term', '2024/2025', coalesce(default_fee, 0), true);
    end if;
  end if;
end $$;