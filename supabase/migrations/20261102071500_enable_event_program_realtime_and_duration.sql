-- Keep program change events available to all subscribed clients.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_programs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_programs;
  END IF;
END $$;

-- Store each presentation and break duration (in minutes) inside the existing
-- event_programs.entries JSONB records. Preserve old rows and supply defaults.
-- Store each presentation and break duration (in minutes) inside the existing
-- event_programs.entries JSONB records. Preserve old rows and supply defaults.
update public.event_programs
set entries = (
  select coalesce(jsonb_agg(
    case
      when jsonb_typeof(item) = 'object' and not (item ? 'duration') then
        item || jsonb_build_object('duration', case when item->>'kind' = 'break' then 10 else 15 end)
      else item
    end order by ordinality
  ), '[]'::jsonb)
  from jsonb_array_elements(entries) with ordinality as rows(item, ordinality)
)
where exists (
  select 1 from jsonb_array_elements(entries) as row_item(item)
  where jsonb_typeof(row_item.item) = 'object' and not (row_item.item ? 'duration')
);
