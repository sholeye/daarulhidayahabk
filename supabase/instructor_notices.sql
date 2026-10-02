-- Instructor-authored notices scoped to one assigned class.
-- Run after DATABASE_SCHEMA.sql.

create table if not exists public.instructor_notices (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.school_classes(id) on delete cascade,
  instructor_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null check (length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instructor_notices_class_created_idx
on public.instructor_notices(class_id, created_at desc);

create table if not exists public.instructor_notice_reads (
  notice_id uuid not null references public.instructor_notices(id) on delete cascade,
  student_id text not null references public.students(student_id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, student_id)
);

create index if not exists instructor_notice_reads_student_idx
on public.instructor_notice_reads(student_id, read_at desc);

alter table public.instructor_notices enable row level security;
alter table public.instructor_notice_reads enable row level security;
drop policy if exists "instructor_notices_select_admin" on public.instructor_notices;
drop policy if exists "instructor_notices_select_instructor" on public.instructor_notices;
drop policy if exists "instructor_notices_select_learner" on public.instructor_notices;
drop policy if exists "instructor_notices_insert_instructor" on public.instructor_notices;
drop policy if exists "instructor_notices_update_instructor" on public.instructor_notices;
drop policy if exists "instructor_notices_delete_instructor" on public.instructor_notices;
drop policy if exists "notice_reads_select_own" on public.instructor_notice_reads;
drop policy if exists "notice_reads_insert_own" on public.instructor_notice_reads;
drop policy if exists "notice_reads_update_own" on public.instructor_notice_reads;

create policy "instructor_notices_select_admin" on public.instructor_notices
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "instructor_notices_select_instructor" on public.instructor_notices
for select to authenticated
using (instructor_id = auth.uid());

create policy "instructor_notices_select_learner" on public.instructor_notices
for select to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.school_classes c on c.name = s.class
    where s.auth_user_id = auth.uid()
      and c.id = instructor_notices.class_id
  )
);

create policy "instructor_notices_insert_instructor" on public.instructor_notices
for insert to authenticated
with check (
  instructor_id = auth.uid()
  and exists (
    select 1 from public.school_classes c
    where c.id = instructor_notices.class_id
      and c.instructor_id = auth.uid()
  )
);

create policy "instructor_notices_update_instructor" on public.instructor_notices
for update to authenticated
using (
  instructor_id = auth.uid()
  and exists (
    select 1 from public.school_classes c
    where c.id = instructor_notices.class_id
      and c.instructor_id = auth.uid()
  )
)
with check (
  instructor_id = auth.uid()
  and exists (
    select 1 from public.school_classes c
    where c.id = instructor_notices.class_id
      and c.instructor_id = auth.uid()
  )
);

create policy "instructor_notices_delete_instructor" on public.instructor_notices
for delete to authenticated
using (
  instructor_id = auth.uid()
  and exists (
    select 1 from public.school_classes c
    where c.id = instructor_notices.class_id
      and c.instructor_id = auth.uid()
  )
);

create policy "notice_reads_select_own" on public.instructor_notice_reads
for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.student_id = instructor_notice_reads.student_id
      and s.auth_user_id = auth.uid()
  )
);

create policy "notice_reads_insert_own" on public.instructor_notice_reads
for insert to authenticated
with check (
  exists (
    select 1
    from public.students s
    join public.instructor_notices n on n.id = instructor_notice_reads.notice_id
    join public.school_classes c on c.name = s.class and c.id = n.class_id
    where s.student_id = instructor_notice_reads.student_id
      and s.auth_user_id = auth.uid()
  )
);

create policy "notice_reads_update_own" on public.instructor_notice_reads
for update to authenticated
using (
  exists (select 1 from public.students s where s.student_id = instructor_notice_reads.student_id and s.auth_user_id = auth.uid())
)
with check (
  exists (select 1 from public.students s where s.student_id = instructor_notice_reads.student_id and s.auth_user_id = auth.uid())
);

grant select, insert, update, delete on public.instructor_notices to authenticated;
grant select, insert, update on public.instructor_notice_reads to authenticated;

create or replace function public.get_unread_instructor_notice_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.instructor_notices n
  join public.students s on s.auth_user_id = auth.uid()
  join public.school_classes c on c.name = s.class and c.id = n.class_id
  where not exists (
    select 1 from public.instructor_notice_reads r
    where r.notice_id = n.id and r.student_id = s.student_id
  );
$$;

revoke all on function public.get_unread_instructor_notice_count() from public;
grant execute on function public.get_unread_instructor_notice_count() to authenticated;

create or replace function public.notify_instructor_notice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _student record;
begin
  for _student in
    select s.auth_user_id
    from public.students s
    join public.school_classes c on c.name = s.class
    where c.id = new.class_id and s.auth_user_id is not null
  loop
    insert into public.notifications(user_id, title, message, type, is_read, link)
    values (
      _student.auth_user_id,
      new.title,
      left(new.body, 180),
      'info',
      false,
      '/learner/notices'
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists instructor_notices_notify_students on public.instructor_notices;
create trigger instructor_notices_notify_students
after insert on public.instructor_notices
for each row execute function public.notify_instructor_notice();

create or replace function public.set_instructor_notice_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists instructor_notices_updated_at on public.instructor_notices;
create trigger instructor_notices_updated_at
before update on public.instructor_notices
for each row execute function public.set_instructor_notice_updated_at();
