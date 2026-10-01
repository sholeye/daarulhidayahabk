-- Class-scoped PDF books for instructors and learners.

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.school_classes(id) on delete cascade,
  title text not null,
  description text not null default '',
  instructions text not null default '',
  file_path text not null unique,
  file_name text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_class_id_idx on public.books(class_id);
create index if not exists books_instructor_id_idx on public.books(instructor_id);

alter table public.books enable row level security;

drop policy if exists "books_select_admin" on public.books;
drop policy if exists "books_select_instructor" on public.books;
drop policy if exists "books_select_learner" on public.books;
drop policy if exists "books_insert_instructor" on public.books;
drop policy if exists "books_delete_instructor" on public.books;
drop policy if exists "books_manage_admin" on public.books;

create policy "books_select_admin" on public.books
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "books_select_instructor" on public.books
for select to authenticated
using (instructor_id = auth.uid());

create policy "books_select_learner" on public.books
for select to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.school_classes c on c.name = s.class
    where s.auth_user_id = auth.uid()
      and c.id = books.class_id
  )
);

create policy "books_insert_instructor" on public.books
for insert to authenticated
with check (
  instructor_id = auth.uid()
  and exists (
    select 1 from public.school_classes c
    where c.id = books.class_id and c.instructor_id = auth.uid()
  )
);

create policy "books_delete_instructor" on public.books
for delete to authenticated
using (instructor_id = auth.uid());

create policy "books_manage_admin" on public.books
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do update set public = false;

drop policy if exists "books_storage_select" on storage.objects;
drop policy if exists "books_storage_insert" on storage.objects;
drop policy if exists "books_storage_delete" on storage.objects;

create policy "books_storage_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'books'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.books b
      join public.students s on s.class = (select c.name from public.school_classes c where c.id = b.class_id)
      where b.file_path = name and s.auth_user_id = auth.uid()
    )
  )
);

create policy "books_storage_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_role(auth.uid(), 'instructor')
);

create policy "books_storage_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'books'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
