alter table public.enquiries
  add column follow_up_on date,
  add constraint terminal_enquiry_has_no_follow_up check (
    status not in ('won', 'lost', 'spam') or follow_up_on is null
  );

create index enquiries_due_follow_up_idx on public.enquiries(follow_up_on, created_at)
where follow_up_on is not null and status in ('new', 'qualified', 'inspection', 'offer');

create function public.set_enquiry_follow_up(p_enquiry_id uuid, p_follow_up_on date)
returns date language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.enquiries%rowtype;
  today_lagos date := (now() at time zone 'Africa/Lagos')::date;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'enquiry management is not permitted';
  end if;
  select * into previous_row from public.enquiries where id = p_enquiry_id for update;
  if not found then raise no_data_found using message = 'enquiry not found'; end if;
  if p_follow_up_on is not null then
    if previous_row.status in ('won', 'lost', 'spam') then
      raise check_violation using message = 'closed enquiries cannot have a follow-up';
    end if;
    if p_follow_up_on < today_lagos or p_follow_up_on > today_lagos + 366 then
      raise check_violation using message = 'follow-up date must be within the next year';
    end if;
  end if;
  if previous_row.follow_up_on is not distinct from p_follow_up_on then
    return previous_row.follow_up_on;
  end if;
  update public.enquiries set follow_up_on = p_follow_up_on where id = p_enquiry_id;
  insert into public.audit_events (actor_id, entity_type, entity_id, action, previous_value, next_value)
  values (actor, 'enquiry', p_enquiry_id::text, 'follow_up_changed',
    jsonb_build_object('followUpOn', previous_row.follow_up_on),
    jsonb_build_object('followUpOn', p_follow_up_on));
  return p_follow_up_on;
end;
$$;

create or replace function public.update_enquiry_workflow(
  p_enquiry_id uuid, p_status public.enquiry_status, p_notes text
)
returns public.enquiry_status language plpgsql security definer set search_path = ''
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

  select * into previous_row from public.enquiries where id = p_enquiry_id for update;
  if not found then raise no_data_found using message = 'enquiry not found'; end if;
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

  update public.enquiries set
    status = p_status,
    internal_notes = nullif(p_notes, ''),
    follow_up_on = case when p_status in ('won', 'lost', 'spam') then null else follow_up_on end
  where id = p_enquiry_id returning * into updated_row;
  insert into public.audit_events (actor_id, entity_type, entity_id, action, previous_value, next_value)
  values (actor, 'enquiry', p_enquiry_id::text, 'workflow_updated',
    jsonb_build_object('status', previous_row.status, 'internalNotes', previous_row.internal_notes,
      'followUpOn', previous_row.follow_up_on),
    jsonb_build_object('status', updated_row.status, 'internalNotes', updated_row.internal_notes,
      'followUpOn', updated_row.follow_up_on));
  return updated_row.status;
end;
$$;

revoke all on function public.set_enquiry_follow_up(uuid,date) from public, anon;
grant execute on function public.set_enquiry_follow_up(uuid,date) to authenticated;
