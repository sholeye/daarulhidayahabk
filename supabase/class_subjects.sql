-- Run this migration on an existing Supabase project.
create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.school_classes(id) on delete cascade,
  name text not null,
  name_arabic text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, name)
);

alter table public.class_subjects enable row level security;

drop policy if exists "class_subjects_select_authenticated" on public.class_subjects;
create policy "class_subjects_select_authenticated" on public.class_subjects
for select to authenticated using (true);

drop policy if exists "class_subjects_manage_admin" on public.class_subjects;
create policy "class_subjects_manage_admin" on public.class_subjects
for all to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or exists (select 1 from public.school_classes c where c.id = class_subjects.class_id and c.instructor_id = auth.uid())
)
with check (
  public.has_role(auth.uid(), 'admin')
  or exists (select 1 from public.school_classes c where c.id = class_subjects.class_id and c.instructor_id = auth.uid())
);

do $$ begin
  alter publication supabase_realtime add table public.class_subjects;
exception when duplicate_object then null;
end $$;