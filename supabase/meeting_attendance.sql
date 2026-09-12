create extension if not exists pgcrypto;

-- 1) attendance table
create table if not exists public.meeting_attendance (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  first_name text not null,
  last_name text not null,
  parent_type text,
  phone_number text not null,
  normalized_phone text not null unique,
  number_of_children integer not null check (number_of_children > 0),
  is_parent boolean not null default true,
  representative_relationship text,
  parent_absence_reason text,
  children jsonb not null default '[]'::jsonb,
  selfie_path text,
  signed_in_at timestamptz not null default now(),
  signed_out_at timestamptz,
  sign_out_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meeting_attendance_parent_fields_check
    check (
      (is_parent = true) or (
        representative_relationship is not null and representative_relationship <> '' and
        parent_absence_reason is not null and parent_absence_reason <> ''
      )
    )
);

-- 2) global meeting settings
create table if not exists public.meeting_settings (
  id integer primary key default 1,
  sign_in_enabled boolean not null default true,
  sign_out_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.meeting_settings (id, sign_in_enabled, sign_out_enabled)
values (1, true, false)
on conflict (id) do nothing;

-- 3) indexes
create index if not exists idx_meeting_attendance_phone
  on public.meeting_attendance (normalized_phone);

create index if not exists idx_meeting_attendance_active_phone
  on public.meeting_attendance (normalized_phone, signed_in_at desc, signed_out_at);

create index if not exists idx_meeting_attendance_sign_in
  on public.meeting_attendance (signed_in_at desc);

create index if not exists idx_meeting_attendance_sign_out
  on public.meeting_attendance (signed_out_at desc);

create index if not exists idx_meeting_attendance_sign_out_enabled
  on public.meeting_attendance (sign_out_enabled);

-- 4) trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meeting_attendance_set_updated_at on public.meeting_attendance;
create trigger meeting_attendance_set_updated_at
before update on public.meeting_attendance
for each row execute function public.set_updated_at();

-- 5) functions for admin actions
drop function if exists public.enable_meeting_signout(uuid);
create function public.enable_meeting_signout(attendance_id uuid)
returns setof public.meeting_attendance
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.meeting_attendance
  set sign_out_enabled = true,
      updated_at = now()
  where id = attendance_id
    and signed_in_at is not null
    and signed_out_at is null
    and sign_out_enabled = false;

  return query
  select *
  from public.meeting_attendance
  where id = attendance_id
  limit 1;
end;
$$;

drop function if exists public.set_meeting_attendance_signout(uuid);
create function public.set_meeting_attendance_signout(attendance_id uuid)
returns setof public.meeting_attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meeting_signout_allowed boolean;
begin
  select sign_out_enabled
  into v_meeting_signout_allowed
  from public.meeting_settings
  where id = 1;

  update public.meeting_attendance
  set signed_out_at = now(),
      sign_out_enabled = true,
      updated_at = now()
  where id = attendance_id
    and signed_in_at is not null
    and signed_out_at is null
    and (
      sign_out_enabled = true
      or coalesce(v_meeting_signout_allowed, false)
    );

  return query
  select *
  from public.meeting_attendance
  where id = attendance_id
  limit 1;
end;
$$;

create or replace function public.validate_meeting_settings_state()
returns trigger
language plpgsql
as $$
begin
  if new.sign_in_enabled and new.sign_out_enabled then
    raise exception 'Sign-in and sign-out cannot both be enabled at the same time';
  end if;

  return new;
end;
$$;

drop trigger if exists meeting_settings_guard on public.meeting_settings;
create trigger meeting_settings_guard
before insert or update on public.meeting_settings
for each row execute function public.validate_meeting_settings_state();

drop function if exists public.set_meeting_settings(boolean, boolean);
drop function if exists public.set_meeting_settings(p_sign_in_enabled boolean, p_sign_out_enabled boolean);
create function public.set_meeting_settings(
  p_sign_in_enabled boolean,
  p_sign_out_enabled boolean
)
returns setof public.meeting_settings
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_sign_in_enabled and p_sign_out_enabled then
    raise exception 'Sign-in and sign-out cannot both be enabled at the same time';
  end if;

  insert into public.meeting_settings (id, sign_in_enabled, sign_out_enabled, updated_at)
  values (1, p_sign_in_enabled, p_sign_out_enabled, now())
  on conflict (id) do update
    set sign_in_enabled = excluded.sign_in_enabled,
        sign_out_enabled = excluded.sign_out_enabled,
        updated_at = now();

  return query
  select *
  from public.meeting_settings
  where id = 1
  limit 1;
end;
$$;

-- 6) row level security
alter table public.meeting_attendance enable row level security;
alter table public.meeting_settings enable row level security;

drop policy if exists "Public can create attendance sign-ins" on public.meeting_attendance;
drop policy if exists "Public can read meeting attendance records" on public.meeting_attendance;
drop policy if exists "Public can update sign-out state for a known record" on public.meeting_attendance;
drop policy if exists "Public can delete records only with admin flow" on public.meeting_attendance;
drop policy if exists "Public can create meeting settings" on public.meeting_settings;
drop policy if exists "Public can read meeting settings" on public.meeting_settings;
drop policy if exists "Public can update meeting settings via app" on public.meeting_settings;

create policy "Public can create attendance sign-ins"
on public.meeting_attendance for insert with check (true);

create policy "Public can read meeting attendance records"
on public.meeting_attendance for select using (true);

create policy "Public can update sign-out state for a known record"
on public.meeting_attendance for update using (true) with check (true);

create policy "Public can delete records only with admin flow"
on public.meeting_attendance for delete using (true);

create policy "Public can create meeting settings"
on public.meeting_settings for insert with check (true);

create policy "Public can read meeting settings"
on public.meeting_settings for select using (true);

create policy "Public can update meeting settings via app"
on public.meeting_settings for update using (true) with check (true);

-- 7) photo upload metadata table
create table if not exists public.attendance_photo_uploads (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid references public.meeting_attendance(id) on delete cascade,
  file_path text not null,
  created_at timestamptz not null default now()
);

-- 8) storage bucket must be created in Supabase Storage, not with plain SQL "create storage bucket"
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', false)
on conflict (id) do nothing;

-- 9) storage policies
drop policy if exists "Attendance photos are writable by any user" on storage.objects;
drop policy if exists "Attendance photos are readable by any user" on storage.objects;
drop policy if exists "Attendance photos can be updated by any user" on storage.objects;
drop policy if exists "Attendance photos can be deleted by any user" on storage.objects;

create policy "Attendance photos are writable by any user"
on storage.objects for insert with check (bucket_id = 'attendance-photos');

create policy "Attendance photos are readable by any user"
on storage.objects for select using (bucket_id = 'attendance-photos');

create policy "Attendance photos can be updated by any user"
on storage.objects for update using (bucket_id = 'attendance-photos');

create policy "Attendance photos can be deleted by any user"
on storage.objects for delete using (bucket_id = 'attendance-photos');

