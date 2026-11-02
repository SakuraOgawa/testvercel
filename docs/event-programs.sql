create table public.event_programs (
 event_id uuid primary key references public.presentation_events(id) on delete cascade,
 entries jsonb not null default '[]'::jsonb check (jsonb_typeof(entries) = 'array'),
 revision uuid not null default gen_random_uuid()
);
alter table public.event_programs enable row level security;
revoke all on public.event_programs from anon, authenticated;
grant select, insert, update on public.event_programs to authenticated;
create policy program_read on public.event_programs for select to authenticated using (true);
create policy program_insert on public.event_programs for insert to authenticated with check (
 exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('teacher','admin'))
);
create policy program_update on public.event_programs for update to authenticated using (
 exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('teacher','admin'))
) with check (
 exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('teacher','admin'))
);

-- Realtime: run once if event_programs is not already in the publication.
alter publication supabase_realtime add table public.event_programs;
