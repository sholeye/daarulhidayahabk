-- One-use, role-scoped signup keys for parent and instructor accounts.
-- Run after DATABASE_SCHEMA.sql. Deploy the register-with-allowance Edge Function too.

create table if not exists public.signup_allowance_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  allowed_role public.app_role not null check (allowed_role in ('parent', 'instructor')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  check ((redeemed_by is null) = (redeemed_at is null))
);

alter table public.signup_allowance_keys enable row level security;
drop policy if exists "signup_keys_admin_read" on public.signup_allowance_keys;
drop policy if exists "signup_keys_admin_revoke" on public.signup_allowance_keys;
create policy "signup_keys_admin_read" on public.signup_allowance_keys
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
create policy "signup_keys_admin_revoke" on public.signup_allowance_keys
for update to authenticated
using (public.has_role(auth.uid(), 'admin') and redeemed_at is null and revoked_at is null)
with check (public.has_role(auth.uid(), 'admin') and redeemed_at is null and revoked_at is not null);
revoke all on public.signup_allowance_keys from anon, authenticated;
grant select on public.signup_allowance_keys to authenticated;
grant update (revoked_at) on public.signup_allowance_keys to authenticated;

create or replace function public.create_signup_allowance_key(
  _key_hash text,
  _allowed_role public.app_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _key_id uuid;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only administrators can create signup keys.';
  end if;
  if _allowed_role not in ('parent', 'instructor') then
    raise exception 'Signup keys are only available for parents and instructors.';
  end if;
  if _key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid key hash.';
  end if;

  insert into public.signup_allowance_keys (key_hash, allowed_role, created_by)
  values (_key_hash, _allowed_role, auth.uid())
  returning id into _key_id;
  return _key_id;
end;
$$;

create or replace function public.allowance_signup_key_is_valid(
  _key_hash text,
  _allowed_role public.app_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'service_role' and exists (
    select 1 from public.signup_allowance_keys k
    where k.key_hash = _key_hash
      and k.allowed_role = _allowed_role
      and k.redeemed_at is null
      and k.revoked_at is null
  );
$$;

create or replace function public.redeem_signup_allowance_key(
  _key_hash text,
  _allowed_role public.app_role,
  _user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _key_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Only the signup service can redeem keys.';
  end if;

  update public.signup_allowance_keys
  set redeemed_by = _user_id,
      redeemed_at = now()
  where key_hash = _key_hash
    and allowed_role = _allowed_role
    and redeemed_at is null
    and revoked_at is null
  returning id into _key_id;

  if _key_id is null then
    return false;
  end if;

  delete from public.user_roles
  where user_id = _user_id and role = 'learner';
  insert into public.user_roles (user_id, role)
  values (_user_id, _allowed_role)
  on conflict (user_id, role) do nothing;
  return true;
end;
$$;

revoke all on function public.create_signup_allowance_key(text, public.app_role) from public;
grant execute on function public.create_signup_allowance_key(text, public.app_role) to authenticated;
revoke all on function public.allowance_signup_key_is_valid(text, public.app_role) from public;
grant execute on function public.allowance_signup_key_is_valid(text, public.app_role) to service_role;
revoke all on function public.redeem_signup_allowance_key(text, public.app_role, uuid) from public;
grant execute on function public.redeem_signup_allowance_key(text, public.app_role, uuid) to service_role;

-- Never grant elevated public-signup roles from user-editable metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role public.app_role := 'learner';
begin
  if new.raw_app_meta_data ->> 'allowance_signup_role' in ('parent', 'instructor') then
    signup_role := (new.raw_app_meta_data ->> 'allowance_signup_role')::public.app_role;
  end if;

  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, signup_role)
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

-- Store last activity separately from ephemeral Realtime Presence.
create table if not exists public.message_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
alter table public.message_presence enable row level security;
drop policy if exists "message_presence_read_contacts" on public.message_presence;
drop policy if exists "message_presence_write_own" on public.message_presence;
create policy "message_presence_read_contacts" on public.message_presence
for select to authenticated
using (
  user_id = auth.uid()
  or public.can_message_users(auth.uid(), user_id)
);
create policy "message_presence_write_own" on public.message_presence
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
grant select, insert, update on public.message_presence to authenticated;
