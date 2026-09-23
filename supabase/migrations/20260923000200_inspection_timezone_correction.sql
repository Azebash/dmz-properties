create function public.set_inspection_timezone(
  p_inspection_id uuid,
  p_time_zone text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_zone text;
begin
  if not private.has_staff_role(
    array['administrator', 'property_manager']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'inspection management is not permitted';
  end if;

  if p_time_zone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_time_zone
  ) then
    raise check_violation using message = 'inspection time zone is not recognized';
  end if;

  select time_zone into previous_zone
  from public.inspections where id = p_inspection_id for update;
  if not found then
    raise no_data_found using message = 'inspection not found';
  end if;
  if previous_zone = p_time_zone then return previous_zone; end if;

  update public.inspections set time_zone = p_time_zone
  where id = p_inspection_id;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'inspection', p_inspection_id::text, 'time_zone_corrected',
    jsonb_build_object('timeZone', previous_zone),
    jsonb_build_object('timeZone', p_time_zone)
  );

  return p_time_zone;
end;
$$;

revoke all on function public.set_inspection_timezone(uuid, text) from public, anon;
grant execute on function public.set_inspection_timezone(uuid, text) to authenticated;
