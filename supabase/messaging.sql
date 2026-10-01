-- Direct messaging for admin, instructors, and learners.
-- Run once in the Supabase SQL editor after DATABASE_SCHEMA.sql.

create or replace function public.can_message_users(_user_a uuid, _user_b uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _learner_id uuid;
  _admin_id uuid;
  _instructor_id uuid;
  _student_id text;
begin
  if _user_a is null or _user_b is null or _user_a = _user_b then
    return false;
  end if;

  if (public.has_role(_user_a, 'admin') and public.has_role(_user_b, 'instructor'))
    or (public.has_role(_user_b, 'admin') and public.has_role(_user_a, 'instructor')) then
    return true;
  end if;

  if public.has_role(_user_a, 'admin') and public.has_role(_user_b, 'learner') then
    _admin_id := _user_a;
    _learner_id := _user_b;
  elsif public.has_role(_user_b, 'admin') and public.has_role(_user_a, 'learner') then
    _admin_id := _user_b;
    _learner_id := _user_a;
  end if;

  if _admin_id is not null then
    return exists (
      select 1 from public.students s
      where s.auth_user_id = _learner_id
    );
  end if;

  if public.has_role(_user_a, 'instructor') and public.has_role(_user_b, 'learner') then
    _instructor_id := _user_a;
    _learner_id := _user_b;
  elsif public.has_role(_user_b, 'instructor') and public.has_role(_user_a, 'learner') then
    _instructor_id := _user_b;
    _learner_id := _user_a;
  end if;

  if _instructor_id is not null then
    select s.student_id into _student_id
    from public.students s
    where s.auth_user_id = _learner_id;
    return _student_id is not null
      and public.is_instructor_for_student(_student_id, _instructor_id);
  end if;

  return false;
end;
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references auth.users(id) on delete cascade,
  participant_two uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_one <> participant_two)
);

create unique index if not exists conversations_pair_unique_idx
on public.conversations (
  least(participant_one, participant_two),
  greatest(participant_one, participant_two)
);

create table if not exists public.conversation_user_settings (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_user_settings enable row level security;
drop policy if exists "conversation_settings_select_own" on public.conversation_user_settings;
drop policy if exists "conversation_settings_insert_own" on public.conversation_user_settings;
drop policy if exists "conversation_settings_update_own" on public.conversation_user_settings;
create policy "conversation_settings_select_own" on public.conversation_user_settings
for select to authenticated using (user_id = auth.uid());
create policy "conversation_settings_insert_own" on public.conversation_user_settings
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.participant_one, c.participant_two)
  )
);
create policy "conversation_settings_update_own" on public.conversation_user_settings
for update to authenticated using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.participant_one, c.participant_two)
  )
);
grant select, insert, update on public.conversation_user_settings to authenticated;

create or replace function public.guard_blocked_conversation_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.conversation_user_settings s
    where s.conversation_id = new.conversation_id
      and s.blocked_at is not null
  ) then
    raise exception 'Messages cannot be sent in a blocked conversation.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_blocked_conversation_guard on public.messages;
create trigger messages_blocked_conversation_guard
before insert on public.messages
for each row execute function public.guard_blocked_conversation_message();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  read_at timestamptz,
  edited_at timestamptz,
  reply_to_id uuid references public.messages(id) on delete set null,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists reply_to_id uuid references public.messages(id) on delete set null;
alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_size bigint;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists deleted_by uuid references auth.users(id) on delete set null;
alter table public.messages alter column body set default '';
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_body_or_attachment_check;
alter table public.messages add constraint messages_body_or_attachment_check
  check (
    (length(trim(body)) between 1 and 5000)
    or (length(trim(body)) = 0 and (attachment_path is not null or deleted_at is not null))
  );
  alter table public.messages drop constraint if exists messages_attachment_size_check;
alter table public.messages add constraint messages_attachment_size_check
  check (attachment_size is null or attachment_size between 1 and 2097151);
  alter table public.messages drop constraint if exists messages_attachment_metadata_check;
  alter table public.messages add constraint messages_attachment_metadata_check
    check (
      attachment_path is null
      or (
        attachment_name is not null
        and attachment_type in (
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain'
        )
        and attachment_size between 1 and 2097151
      )
    );
alter table public.messages drop constraint if exists messages_delete_metadata_check;
alter table public.messages add constraint messages_delete_metadata_check
  check (
    (deleted_at is null and deleted_by is null)
    or (deleted_at is not null and deleted_by = sender_id)
  );

create index if not exists messages_conversation_created_idx
on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversation_participants_select" on public.conversations;
drop policy if exists "conversation_participants_insert" on public.conversations;
drop policy if exists "message_participants_select" on public.messages;
drop policy if exists "message_participants_insert" on public.messages;
drop policy if exists "message_sender_edit_update" on public.messages;
drop policy if exists "message_recipient_read_update" on public.messages;
drop policy if exists "message_sender_delete" on public.messages;

create policy "conversation_participants_select" on public.conversations
for select to authenticated
using (
  auth.uid() in (participant_one, participant_two)
  and public.can_message_users(participant_one, participant_two)
);

create policy "conversation_participants_insert" on public.conversations
for insert to authenticated
with check (
  auth.uid() in (participant_one, participant_two)
  and public.can_message_users(participant_one, participant_two)
);

create policy "message_participants_select" on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.participant_one, c.participant_two)
      and public.can_message_users(c.participant_one, c.participant_two)
  )
);

create policy "message_participants_insert" on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and deleted_at is null
  and deleted_by is null
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.participant_one, c.participant_two)
      and public.can_message_users(c.participant_one, c.participant_two)
  )
);

create policy "message_sender_edit_update" on public.messages
for update to authenticated
using (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and public.can_message_users(c.participant_one, c.participant_two)
  )
)
with check (sender_id = auth.uid());

create policy "message_recipient_read_update" on public.messages
for update to authenticated
using (
  sender_id <> auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.participant_one, c.participant_two)
      and public.can_message_users(c.participant_one, c.participant_two)
  )
)
with check (sender_id <> auth.uid());

create policy "message_sender_delete" on public.messages
for delete to authenticated
using (sender_id = auth.uid());

create or replace function public.guard_message_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.sender_id then
    if old.deleted_at is not null then
      raise exception 'Deleted messages cannot be changed.';
    end if;
    if new.sender_id <> old.sender_id
      or new.conversation_id <> old.conversation_id
      or new.reply_to_id is distinct from old.reply_to_id
      or new.attachment_path is distinct from old.attachment_path
      or new.attachment_name is distinct from old.attachment_name
      or new.attachment_type is distinct from old.attachment_type
      or new.attachment_size is distinct from old.attachment_size
      or new.read_at is distinct from old.read_at then
      raise exception 'Only authored message text can be edited.';
    end if;
    if old.deleted_at is null and new.deleted_at is not null then
      if new.deleted_by is distinct from auth.uid()
        or new.edited_at is distinct from old.edited_at then
        raise exception 'Only the sender can delete this message.';
      end if;
      new.body := '';
      new.attachment_path := null;
      new.attachment_name := null;
      new.attachment_type := null;
      new.attachment_size := null;
    elsif new.deleted_at is distinct from old.deleted_at
      or new.deleted_by is distinct from old.deleted_by then
      raise exception 'Message deletion state cannot be changed.';
    else
      new.edited_at := now();
    end if;
  elsif new.sender_id = old.sender_id
    and new.conversation_id = old.conversation_id
    and new.body = old.body
    and new.edited_at is not distinct from old.edited_at
    and new.reply_to_id is not distinct from old.reply_to_id
    and new.attachment_path is not distinct from old.attachment_path
    and new.attachment_name is not distinct from old.attachment_name
    and new.attachment_type is not distinct from old.attachment_type
    and new.attachment_size is not distinct from old.attachment_size
    and new.deleted_at is not distinct from old.deleted_at
    and new.deleted_by is not distinct from old.deleted_by
    and old.read_at is null
    and new.read_at is not null then
    null;
  else
    raise exception 'Message update is not allowed.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_guard_update on public.messages;
create trigger messages_guard_update
before update on public.messages
for each row execute function public.guard_message_update();

drop function if exists public.get_message_contacts();

create function public.get_message_contacts()
returns table(
  user_id uuid,
  display_name text,
  contact_role public.app_role,
  email text,
  avatar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  if public.has_role(auth.uid(), 'admin') then
    return query
      select distinct p.id, p.full_name, ur.role, p.email, p.avatar_url
      from public.profiles p
      join public.user_roles ur on ur.user_id = p.id
      where ur.role = 'instructor'
      union
      select distinct p.id, p.full_name, ur.role, p.email, p.avatar_url
      from public.students s
      join public.profiles p on p.id = s.auth_user_id
      join public.user_roles ur on ur.user_id = p.id and ur.role = 'learner'
      where s.auth_user_id is not null;
  elsif public.has_role(auth.uid(), 'instructor') then
    return query
      select distinct p.id, p.full_name, ur.role, p.email, p.avatar_url
      from public.students s
      join public.school_classes c on c.name = s.class and c.instructor_id = auth.uid()
      join public.profiles p on p.id = s.auth_user_id
      join public.user_roles ur on ur.user_id = p.id and ur.role = 'learner'
      where s.auth_user_id is not null
      union
      select distinct p.id, p.full_name, ur.role, p.email, p.avatar_url
      from public.profiles p
      join public.user_roles ur on ur.user_id = p.id and ur.role = 'admin';
  elsif public.has_role(auth.uid(), 'learner') then
    return query
      select distinct p.id, p.full_name, ur.role, p.email, p.avatar_url
      from public.profiles p
      join public.user_roles ur on ur.user_id = p.id and ur.role = 'admin'
      union
      select distinct p.id, p.full_name, ur.role, p.email, p.avatar_url
      from public.students s
      join public.school_classes c on c.name = s.class
      join public.profiles p on p.id = c.instructor_id
      join public.user_roles ur on ur.user_id = p.id and ur.role = 'instructor'
      where s.auth_user_id = auth.uid();
  end if;
end;
$$;

revoke all on function public.get_message_contacts() from public;
grant execute on function public.get_message_contacts() to authenticated;
revoke all on function public.can_message_users(uuid, uuid) from public;
grant execute on function public.can_message_users(uuid, uuid) to authenticated;

create or replace function public.get_unread_message_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where auth.uid() in (c.participant_one, c.participant_two)
    and m.sender_id <> auth.uid()
    and m.read_at is null
    and m.deleted_at is null
    and public.can_message_users(c.participant_one, c.participant_two);
$$;

revoke all on function public.get_unread_message_count() from public;
grant execute on function public.get_unread_message_count() to authenticated;

grant select, insert on public.conversations to authenticated;
revoke update, delete on public.messages from authenticated;
grant select, insert on public.messages to authenticated;
grant update (body, edited_at, deleted_at, deleted_by) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-files',
  'message-files',
  false,
  2097151,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 2097151,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "message_files_select" on storage.objects;
drop policy if exists "message_files_insert" on storage.objects;
drop policy if exists "message_files_delete" on storage.objects;

create policy "message_files_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'message-files'
  and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.participant_one, c.participant_two)
      and public.can_message_users(c.participant_one, c.participant_two)
  )
);

create policy "message_files_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'message-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.participant_one, c.participant_two)
      and public.can_message_users(c.participant_one, c.participant_two)
  )
);

create policy "message_files_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'message-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.participant_one, c.participant_two)
  )
);

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _recipient uuid;
  _role public.app_role;
  _route text;
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;

  select case
    when c.participant_one = new.sender_id then c.participant_two
    else c.participant_one
  end into _recipient
  from public.conversations c
  where c.id = new.conversation_id;

  _role := public.get_primary_role(_recipient);
  _route := case _role
    when 'admin' then '/admin/messages'
    when 'instructor' then '/instructor/messages'
    when 'learner' then '/learner/messages'
    else '/'
  end;

  insert into public.notifications(user_id, title, message, type, is_read, link)
  values (
    _recipient,
    'New message',
    left(new.body, 180),
    'info',
    false,
    _route || '?conversation=' || new.conversation_id::text
  );
  return new;
end;
$$;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient
after insert on public.messages
for each row execute function public.notify_new_message();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end;
$$;
