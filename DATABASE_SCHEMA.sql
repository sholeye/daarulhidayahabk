-- =============================================================================
-- DAARUL HIDAYAH - CLEAN SUPABASE SCHEMA (Fresh Install / Safe Re-run)
-- =============================================================================
-- Run this in the Supabase SQL editor after creating a fresh project.
-- Required Supabase Auth setting: turn OFF "Confirm email" while testing.
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- ENUMS
-- =============================================================================

do $$ begin
  create type public.app_role as enum ('admin', 'instructor', 'learner', 'parent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fee_status as enum ('paid', 'unpaid', 'partial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.announcement_category as enum ('general', 'academic', 'event', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('completed', 'pending', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('info', 'success', 'warning', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quiz_question_type as enum ('mcq', 'true_false', 'short_answer', 'essay');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quiz_competition_status as enum ('upcoming', 'live', 'grading', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.school_level as enum ('preparatory', 'primary');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TABLES
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.school_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default 'Daarul Hidayah',
  motto text not null default 'Learn for servitude to Allah and Sincerity of Religion',
  email text not null default 'daarulhidayahabk@gmail.com',
  phone text not null default '08085944916',
  address text not null default 'Ita Ika, Abeokuta, Ogun State',
  term_fee numeric(10,2) not null default 6000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_arabic text not null default '',
  level public.school_level not null,
  instructor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  student_id text not null unique,
  full_name text not null,
  email text not null unique,
  date_of_birth date,
  address text,
  phone text,
  origin text,
  sex text check (sex in ('male', 'female')),
  guardian_name text not null default '',
  guardian_phone text not null default '',
  guardian_occupation text,
  guardian_state text,
  class text not null references public.school_classes(name) on update cascade,
  enrollment_date date not null default current_date,
  fee_status public.fee_status not null default 'unpaid',
  amount_paid numeric(10,2) not null default 0,
  total_fee numeric(10,2) not null default 6000,
  image_url text,
  qr_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  term text not null,
  session text not null,
  subjects jsonb not null default '[]'::jsonb,
  total_score numeric(10,2) not null default 0,
  average_score numeric(10,2) not null default 0,
  position integer,
  teacher_remarks text,
  principal_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, term, session)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  date date not null,
  status public.attendance_status not null,
  check_in_time text,
  check_out_time text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  date date not null default current_date,
  term text not null,
  session text not null,
  payment_method text not null,
  receipt_number text not null unique,
  status public.payment_status not null default 'completed',
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category public.announcement_category not null default 'general',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  excerpt text,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Admin',
  author_role public.app_role not null default 'admin',
  is_published boolean not null default false,
  tags text[] not null default '{}',
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create table if not exists public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null references public.students(student_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null default 'info',
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_arabic text not null default '',
  color text not null default '',
  total_score integer not null default 0,
  competitions_won integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  question_arabic text,
  type public.quiz_question_type not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null default '',
  points integer not null default 10,
  time_limit integer not null default 30,
  max_points integer,
  rubric text,
  rubric_arabic text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scheduled_date date not null,
  scheduled_time text not null default '10:00',
  status public.quiz_competition_status not null default 'upcoming',
  question_ids uuid[] not null default '{}',
  reps_per_house integer not null default 3 check (reps_per_house > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_representatives (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.quiz_competitions(id) on delete cascade,
  name text not null,
  house text not null check (house in ('AbuBakr', 'Umar', 'Uthman', 'Ali')),
  login_code text not null,
  has_completed boolean not null default false,
  score integer not null default 0,
  assigned_question_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, login_code)
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.quiz_competitions(id) on delete cascade,
  representative_id uuid not null references public.quiz_representatives(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer text not null default '',
  is_correct boolean not null default false,
  points_earned integer not null default 0,
  time_spent integer not null default 0,
  pending_grade boolean not null default false,
  graded_by uuid references auth.users(id) on delete set null,
  graded_at timestamptz,
  feedback text,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null unique references public.quiz_competitions(id) on delete cascade,
  house_scores jsonb not null default '{}'::jsonb,
  winning_house text not null check (winning_house in ('AbuBakr', 'Umar', 'Uthman', 'Ali')),
  top_student_name text,
  top_student_house text check (top_student_house in ('AbuBakr', 'Umar', 'Uthman', 'Ali')),
  top_student_score integer not null default 0,
  completed_at timestamptz not null default now()
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.get_primary_role(_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = _user_id
  order by case ur.role
    when 'admin' then 1
    when 'instructor' then 2
    when 'parent' then 3
    else 4
  end
  limit 1;
$$;

create or replace function public.is_student_owner(_student_id text, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.student_id = _student_id
      and s.auth_user_id = _user_id
  );
$$;

create or replace function public.is_parent_of_student(_student_id text, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_students ps
    where ps.student_id = _student_id
      and ps.parent_id = _user_id
  );
$$;

create or replace function public.is_instructor_for_student(_student_id text, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.school_classes sc on sc.name = s.class
    where s.student_id = _student_id
      and sc.instructor_id = _user_id
  );
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role public.app_role;
begin
  signup_role := case
    when new.raw_user_meta_data ->> 'role' = 'instructor' then 'instructor'::public.app_role
    when new.raw_user_meta_data ->> 'role' = 'parent' then 'parent'::public.app_role
    when new.raw_user_meta_data ->> 'role' = 'learner' then 'learner'::public.app_role
    else 'learner'::public.app_role
  end;

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

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set full_name = coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), profiles.full_name),
      email = coalesce(new.email, profiles.email),
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

create or replace function public.sync_student_payment_totals(_student_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_paid numeric(10,2);
begin
  select coalesce(sum(amount), 0)
  into total_paid
  from public.payments
  where student_id = _student_id
    and status = 'completed';

  update public.students
  set amount_paid = total_paid,
      fee_status = case
        when total_paid >= total_fee then 'paid'::public.fee_status
        when total_paid > 0 then 'partial'::public.fee_status
        else 'unpaid'::public.fee_status
      end,
      updated_at = now()
  where student_id = _student_id;
end;
$$;

create or replace function public.handle_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.sync_student_payment_totals(old.student_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.sync_student_payment_totals(new.student_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.notify_admins_on_password_reset_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, link)
  select ur.user_id,
         'Password Reset Request',
         'Student ' || new.student_id || ' requested a password reset.',
         'warning',
         '/admin/students'
  from public.user_roles ur
  where ur.role = 'admin';

  return new;
end;
$$;

create or replace function public.notify_parents_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, link)
  select ps.parent_id,
         'Fee Payment Recorded',
         'A payment of ₦' || trim(to_char(new.amount, 'FM9999999990.00')) || ' was recorded for student ' || new.student_id || '.',
         'success',
         '/parent/fees'
  from public.parent_students ps
  where ps.student_id = new.student_id;

  return new;
end;
$$;

create or replace function public.notify_author_on_blog_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author uuid;
  post_title text;
begin
  select bp.author_id, bp.title
  into target_author, post_title
  from public.blog_posts bp
  where bp.id = new.post_id;

  if target_author is not null and target_author <> new.user_id then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      target_author,
      'Post Liked',
      'Someone liked your post "' || post_title || '".',
      'info',
      '/blog'
    );
  end if;

  return new;
end;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_auth_user_updated();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at();

drop trigger if exists update_school_settings_updated_at on public.school_settings;
create trigger update_school_settings_updated_at before update on public.school_settings
for each row execute function public.update_updated_at();

drop trigger if exists update_school_classes_updated_at on public.school_classes;
create trigger update_school_classes_updated_at before update on public.school_classes
for each row execute function public.update_updated_at();

drop trigger if exists update_students_updated_at on public.students;
create trigger update_students_updated_at before update on public.students
for each row execute function public.update_updated_at();

drop trigger if exists update_results_updated_at on public.results;
create trigger update_results_updated_at before update on public.results
for each row execute function public.update_updated_at();

drop trigger if exists update_payments_updated_at on public.payments;
create trigger update_payments_updated_at before update on public.payments
for each row execute function public.update_updated_at();

drop trigger if exists update_announcements_updated_at on public.announcements;
create trigger update_announcements_updated_at before update on public.announcements
for each row execute function public.update_updated_at();

drop trigger if exists update_blog_posts_updated_at on public.blog_posts;
create trigger update_blog_posts_updated_at before update on public.blog_posts
for each row execute function public.update_updated_at();

drop trigger if exists update_quiz_houses_updated_at on public.quiz_houses;
create trigger update_quiz_houses_updated_at before update on public.quiz_houses
for each row execute function public.update_updated_at();

drop trigger if exists update_quiz_questions_updated_at on public.quiz_questions;
create trigger update_quiz_questions_updated_at before update on public.quiz_questions
for each row execute function public.update_updated_at();

drop trigger if exists update_quiz_competitions_updated_at on public.quiz_competitions;
create trigger update_quiz_competitions_updated_at before update on public.quiz_competitions
for each row execute function public.update_updated_at();

drop trigger if exists update_quiz_representatives_updated_at on public.quiz_representatives;
create trigger update_quiz_representatives_updated_at before update on public.quiz_representatives
for each row execute function public.update_updated_at();

drop trigger if exists payments_sync_student_totals on public.payments;
create trigger payments_sync_student_totals
  after insert or update or delete on public.payments
  for each row execute function public.handle_payment_change();

drop trigger if exists password_reset_requests_notify_admins on public.password_reset_requests;
create trigger password_reset_requests_notify_admins
  after insert on public.password_reset_requests
  for each row execute function public.notify_admins_on_password_reset_request();

drop trigger if exists payments_notify_parents on public.payments;
create trigger payments_notify_parents
  after insert on public.payments
  for each row execute function public.notify_parents_on_payment();

drop trigger if exists blog_likes_notify_author on public.blog_likes;
create trigger blog_likes_notify_author
  after insert on public.blog_likes
  for each row execute function public.notify_author_on_blog_like();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.school_settings enable row level security;
alter table public.school_classes enable row level security;
alter table public.students enable row level security;
alter table public.results enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;
alter table public.announcements enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_likes enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.parent_students enable row level security;
alter table public.notifications enable row level security;
alter table public.quiz_houses enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_competitions enable row level security;
alter table public.quiz_representatives enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_competition_results enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_select_admin" on public.profiles
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "profiles_insert_service" on public.profiles
for insert to service_role
with check (true);

create policy "roles_select_own" on public.user_roles
for select to authenticated
using (user_id = auth.uid());

create policy "roles_select_admin" on public.user_roles
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "roles_insert_admin" on public.user_roles
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "roles_delete_admin" on public.user_roles
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "roles_insert_service" on public.user_roles
for insert to service_role
with check (true);

create policy "school_settings_select_public" on public.school_settings
for select
using (true);

create policy "school_settings_manage_admin" on public.school_settings
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "school_classes_select_public" on public.school_classes
for select
using (true);

create policy "school_classes_manage_admin" on public.school_classes
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "students_select_admin" on public.students
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "students_select_instructor" on public.students
for select to authenticated
using (public.is_instructor_for_student(student_id, auth.uid()));

create policy "students_select_own" on public.students
for select to authenticated
using (auth_user_id = auth.uid());

create policy "students_select_parent" on public.students
for select to authenticated
using (public.is_parent_of_student(student_id, auth.uid()));

create policy "students_insert_admin" on public.students
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "students_update_admin" on public.students
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "students_delete_admin" on public.students
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "results_select_admin" on public.results
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "results_select_instructor" on public.results
for select to authenticated
using (public.is_instructor_for_student(student_id, auth.uid()));

create policy "results_select_own" on public.results
for select to authenticated
using (public.is_student_owner(student_id, auth.uid()));

create policy "results_select_parent" on public.results
for select to authenticated
using (public.is_parent_of_student(student_id, auth.uid()));

create policy "results_insert_admin" on public.results
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "results_insert_instructor" on public.results
for insert to authenticated
with check (public.is_instructor_for_student(student_id, auth.uid()));

create policy "results_update_admin" on public.results
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "results_update_instructor" on public.results
for update to authenticated
using (public.is_instructor_for_student(student_id, auth.uid()))
with check (public.is_instructor_for_student(student_id, auth.uid()));

create policy "results_delete_admin" on public.results
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "results_delete_instructor" on public.results
for delete to authenticated
using (public.is_instructor_for_student(student_id, auth.uid()));

create policy "attendance_select_admin" on public.attendance
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "attendance_select_instructor" on public.attendance
for select to authenticated
using (public.is_instructor_for_student(student_id, auth.uid()));

create policy "attendance_select_own" on public.attendance
for select to authenticated
using (public.is_student_owner(student_id, auth.uid()));

create policy "attendance_select_parent" on public.attendance
for select to authenticated
using (public.is_parent_of_student(student_id, auth.uid()));

create policy "attendance_insert_admin" on public.attendance
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "attendance_insert_instructor" on public.attendance
for insert to authenticated
with check (public.is_instructor_for_student(student_id, auth.uid()));

create policy "attendance_update_admin" on public.attendance
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "attendance_update_instructor" on public.attendance
for update to authenticated
using (public.is_instructor_for_student(student_id, auth.uid()))
with check (public.is_instructor_for_student(student_id, auth.uid()));

create policy "attendance_delete_admin" on public.attendance
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "payments_select_admin" on public.payments
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "payments_select_own" on public.payments
for select to authenticated
using (public.is_student_owner(student_id, auth.uid()));

create policy "payments_select_parent" on public.payments
for select to authenticated
using (public.is_parent_of_student(student_id, auth.uid()));

create policy "payments_insert_admin" on public.payments
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "payments_update_admin" on public.payments
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "payments_delete_admin" on public.payments
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "announcements_select_active" on public.announcements
for select
using (is_active = true);

create policy "announcements_select_admin" on public.announcements
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "announcements_manage_admin" on public.announcements
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "blog_posts_select_published" on public.blog_posts
for select
using (is_published = true);

create policy "blog_posts_select_admin" on public.blog_posts
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "blog_posts_manage_admin" on public.blog_posts
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "blog_likes_select_public" on public.blog_likes
for select
using (true);

create policy "blog_likes_insert_authenticated" on public.blog_likes
for insert to authenticated
with check (user_id = auth.uid());

create policy "blog_likes_delete_own" on public.blog_likes
for delete to authenticated
using (user_id = auth.uid());

create policy "password_reset_select_admin" on public.password_reset_requests
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "password_reset_select_own" on public.password_reset_requests
for select to authenticated
using (public.is_student_owner(student_id, auth.uid()));

create policy "password_reset_select_parent" on public.password_reset_requests
for select to authenticated
using (public.is_parent_of_student(student_id, auth.uid()));

create policy "password_reset_insert_requester" on public.password_reset_requests
for insert to authenticated
with check (
  public.has_role(auth.uid(), 'admin')
  or public.is_student_owner(student_id, auth.uid())
  or public.is_parent_of_student(student_id, auth.uid())
);

create policy "password_reset_update_admin" on public.password_reset_requests
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "parent_students_select_admin" on public.parent_students
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "parent_students_select_parent" on public.parent_students
for select to authenticated
using (parent_id = auth.uid());

create policy "parent_students_manage_admin" on public.parent_students
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "notifications_select_own" on public.notifications
for select to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
for delete to authenticated
using (user_id = auth.uid());

create policy "notifications_insert_authenticated" on public.notifications
for insert to authenticated
with check (true);

create policy "notifications_insert_service" on public.notifications
for insert to service_role
with check (true);

create policy "quiz_houses_select_public" on public.quiz_houses
for select
using (true);

create policy "quiz_houses_manage_admin" on public.quiz_houses
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "quiz_questions_select_public" on public.quiz_questions
for select
using (true);

create policy "quiz_questions_manage_admin" on public.quiz_questions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "quiz_competitions_select_public" on public.quiz_competitions
for select
using (true);

create policy "quiz_competitions_manage_admin" on public.quiz_competitions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "quiz_representatives_select_public" on public.quiz_representatives
for select
using (true);

create policy "quiz_representatives_insert_admin" on public.quiz_representatives
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "quiz_representatives_update_public" on public.quiz_representatives
for update
using (true)
with check (true);

create policy "quiz_representatives_delete_admin" on public.quiz_representatives
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "quiz_answers_select_admin" on public.quiz_answers
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "quiz_answers_insert_public" on public.quiz_answers
for insert
with check (true);

create policy "quiz_answers_update_admin" on public.quiz_answers
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "quiz_comp_results_select_public" on public.quiz_competition_results
for select
using (true);

create policy "quiz_comp_results_insert_public" on public.quiz_competition_results
for insert
with check (true);

create policy "quiz_comp_results_manage_admin" on public.quiz_competition_results
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- STORAGE
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
declare
  storage_policy record;
begin
  for storage_policy in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'avatar_%'
  loop
    execute format('drop policy if exists %I on storage.objects', storage_policy.policyname);
  end loop;
end $$;

create policy "avatar_upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatar_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatar_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatar_view" on storage.objects
for select
using (bucket_id = 'avatars');

-- =============================================================================
-- REALTIME
-- =============================================================================

do $$ begin alter publication supabase_realtime add table public.announcements; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.blog_posts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.blog_likes; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.students; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.results; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.attendance; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.payments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.school_classes; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_houses; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_questions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_competitions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_representatives; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_competition_results; exception when duplicate_object then null; end $$;

-- =============================================================================
-- SEED DATA (NO DEMO STUDENTS / NO DEMO ANNOUNCEMENTS)
-- =============================================================================

insert into public.school_settings (id, name, motto, email, phone, address, term_fee)
values (
  1,
  'Daarul Hidayah',
  'Learn for servitude to Allah and Sincerity of Religion',
  'daarulhidayahabk@gmail.com',
  '08085944916',
  'Ita Ika, Abeokuta, Ogun State',
  6000
)
on conflict (id) do update set
  name = excluded.name,
  motto = excluded.motto,
  email = excluded.email,
  phone = excluded.phone,
  address = excluded.address,
  term_fee = excluded.term_fee;

insert into public.school_classes (name, name_arabic, level)
values
  ('Safu Awwal', 'الصف الأول', 'preparatory'),
  ('Safu Thaniy', 'الصف الثاني', 'preparatory'),
  ('Safu Thalith', 'الصف الثالث', 'preparatory'),
  ('Awwal Ibtidai', 'الأول ابتدائي', 'primary'),
  ('Thaniy Ibtidai', 'الثاني ابتدائي', 'primary'),
  ('Thalith Ibtidai', 'الثالث ابتدائي', 'primary')
on conflict (name) do nothing;

insert into public.quiz_houses (name, name_arabic, color)
values
  ('AbuBakr', 'أبو بكر', 'emerald'),
  ('Umar', 'عمر', 'blue'),
  ('Uthman', 'عثمان', 'amber'),
  ('Ali', 'علي', 'rose')
on conflict (name) do nothing;

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_students_auth_user_id on public.students(auth_user_id);
create index if not exists idx_students_class on public.students(class);
create index if not exists idx_results_student_term_session on public.results(student_id, term, session);
create index if not exists idx_attendance_student_date on public.attendance(student_id, date);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_parent_students_parent_id on public.parent_students(parent_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_quiz_representatives_competition_id on public.quiz_representatives(competition_id);
create index if not exists idx_quiz_answers_competition_id on public.quiz_answers(competition_id);

-- =============================================================================
-- COPY/PASTE QUICK ACTIONS
-- =============================================================================

-- 1) Promote a signed-up user to admin
-- replace your@email.com
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role
-- from auth.users
-- where email = 'your@email.com'
-- on conflict (user_id, role) do nothing;

-- 2) Link a parent to a student
-- insert into public.parent_students (parent_id, student_id)
-- values (
--   (select id from auth.users where email = 'parent@email.com'),
--   'abd4567'
-- )
-- on conflict (parent_id, student_id) do nothing;

-- 3) Assign an instructor to a class
-- update public.school_classes
-- set instructor_id = (select id from auth.users where email = 'teacher@email.com')
-- where name = 'Safu Awwal';
