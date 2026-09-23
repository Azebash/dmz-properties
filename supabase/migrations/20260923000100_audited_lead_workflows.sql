create function public.update_enquiry_workflow(
  p_enquiry_id uuid,
  p_status public.enquiry_status,
  p_notes text
)
returns public.enquiry_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.enquiries%rowtype;
  updated_row public.enquiries%rowtype;
begin
  if not private.has_staff_role(
    array['administrator', 'property_manager']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'enquiry management is not permitted';
  end if;

  select * into previous_row
  from public.enquiries where id = p_enquiry_id for update;
  if not found then
    raise no_data_found using message = 'enquiry not found';
  end if;

  if char_length(coalesce(p_notes, '')) > 5000 then
    raise check_violation using message = 'internal notes exceed 5000 characters';
  end if;

  if p_status is null or not (
    p_status = previous_row.status
    or (previous_row.status = 'new' and p_status in ('qualified', 'lost', 'spam'))
    or (previous_row.status = 'qualified' and p_status in ('inspection', 'offer', 'lost', 'spam'))
    or (previous_row.status = 'inspection' and p_status in ('qualified', 'offer', 'lost'))
    or (previous_row.status = 'offer' and p_status in ('won', 'lost'))
    or (previous_row.status = 'lost' and p_status = 'qualified')
    or (previous_row.status = 'spam' and p_status = 'new')
  ) then
    raise check_violation using message = 'invalid enquiry status transition';
  end if;

  if p_status = previous_row.status
    and coalesce(p_notes, '') = coalesce(previous_row.internal_notes, '') then
    return previous_row.status;
  end if;

  update public.enquiries
  set status = p_status,
      internal_notes = nullif(p_notes, '')
  where id = p_enquiry_id
  returning * into updated_row;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'enquiry', p_enquiry_id::text, 'workflow_updated',
    jsonb_build_object('status', previous_row.status, 'internalNotes', previous_row.internal_notes),
    jsonb_build_object('status', updated_row.status, 'internalNotes', updated_row.internal_notes)
  );

  return updated_row.status;
end;
$$;

create function public.update_inspection_workflow(
  p_inspection_id uuid,
  p_status public.inspection_status,
  p_scheduled_local text,
  p_outcome_notes text
)
returns public.inspection_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.inspections%rowtype;
  updated_row public.inspections%rowtype;
  scheduled_at_utc timestamptz;
begin
  if not private.has_staff_role(
    array['administrator', 'property_manager']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'inspection management is not permitted';
  end if;

  select * into previous_row
  from public.inspections where id = p_inspection_id for update;
  if not found then
    raise no_data_found using message = 'inspection not found';
  end if;

  if char_length(coalesce(p_outcome_notes, '')) > 5000 then
    raise check_violation using message = 'outcome notes exceed 5000 characters';
  end if;

  if p_status is null or not (
    (previous_row.status = 'requested' and p_status in ('confirmed', 'cancelled'))
    or (previous_row.status = 'confirmed' and p_status in ('completed', 'cancelled', 'no_show'))
    or (previous_row.status = 'cancelled' and p_status = 'requested')
  ) then
    raise check_violation using message = 'invalid inspection status transition';
  end if;

  if p_status = 'confirmed' then
    if coalesce(p_scheduled_local, '') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then
      raise check_violation using message = 'a scheduled local date and time is required';
    end if;
    if not exists (select 1 from pg_catalog.pg_timezone_names where name = previous_row.time_zone) then
      raise check_violation using message = 'inspection time zone is not recognized';
    end if;
    begin
      scheduled_at_utc := p_scheduled_local::timestamp at time zone previous_row.time_zone;
    exception when datetime_field_overflow or invalid_datetime_format then
      raise check_violation using message = 'scheduled date and time are invalid';
    end;
    if scheduled_at_utc <= now() then
      raise check_violation using message = 'inspection time must be in the future';
    end if;
  elsif p_status = 'completed' then
    if previous_row.scheduled_at is null or length(trim(coalesce(p_outcome_notes, ''))) < 10 then
      raise check_violation using message = 'completed inspections require a schedule and outcome notes';
    end if;
  end if;

  update public.inspections
  set status = p_status,
      scheduled_at = case when p_status = 'confirmed' then scheduled_at_utc
        when p_status = 'requested' then null else scheduled_at end,
      outcome_notes = case when p_status = 'completed'
        then trim(p_outcome_notes) else outcome_notes end
  where id = p_inspection_id
  returning * into updated_row;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'inspection', p_inspection_id::text, 'workflow_updated',
    jsonb_build_object('status', previous_row.status, 'scheduledAt', previous_row.scheduled_at, 'outcomeNotes', previous_row.outcome_notes),
    jsonb_build_object('status', updated_row.status, 'scheduledAt', updated_row.scheduled_at, 'outcomeNotes', updated_row.outcome_notes)
  );

  return updated_row.status;
end;
$$;

revoke all on function public.update_enquiry_workflow(uuid, public.enquiry_status, text)
from public, anon;
grant execute on function public.update_enquiry_workflow(uuid, public.enquiry_status, text)
to authenticated;

revoke all on function public.update_inspection_workflow(uuid, public.inspection_status, text, text)
from public, anon;
grant execute on function public.update_inspection_workflow(uuid, public.inspection_status, text, text)
to authenticated;
