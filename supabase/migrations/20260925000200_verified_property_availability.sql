alter table public.properties
  add column availability_status text not null default 'unconfirmed'
    check (availability_status in ('unconfirmed', 'available', 'on_hold')),
  add column availability_checked_at timestamptz,
  add constraint property_availability_has_check check (
    (availability_status = 'unconfirmed' and availability_checked_at is null)
    or (availability_status in ('available', 'on_hold') and availability_checked_at is not null)
  );

create function public.set_property_availability(
  p_property_id uuid, p_status text, p_checked boolean
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.properties%rowtype;
  next_row public.properties%rowtype;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property availability editing is not permitted';
  end if;
  select * into previous_row from public.properties where id = p_property_id for update;
  if not found then raise no_data_found using message = 'property not found'; end if;
  if previous_row.status <> 'published' then
    raise check_violation using message = 'only published listings can have confirmed availability';
  end if;
  if p_status is null or p_status not in ('unconfirmed', 'available', 'on_hold') then
    raise check_violation using message = 'invalid availability status';
  end if;
  if p_status <> 'unconfirmed' and p_checked is distinct from true then
    raise check_violation using message = 'availability confirmation is required';
  end if;
  if p_status = 'unconfirmed' and previous_row.availability_status = 'unconfirmed' then
    return 'unconfirmed';
  end if;
  update public.properties set
    availability_status = p_status,
    availability_checked_at = case when p_status = 'unconfirmed' then null else now() end,
    updated_by = actor
  where id = p_property_id returning * into next_row;
  insert into public.audit_events
    (actor_id, entity_type, entity_id, action, previous_value, next_value)
  values (actor, 'property', p_property_id::text, 'availability_checked',
    jsonb_build_object('status', previous_row.availability_status,
      'checkedAt', previous_row.availability_checked_at),
    jsonb_build_object('status', next_row.availability_status,
      'checkedAt', next_row.availability_checked_at, 'confirmed', p_checked is true));
  return next_row.availability_status;
end;
$$;

create or replace function public.transition_property_status(
  p_property_id uuid, p_status public.property_status
)
returns public.property_status
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_status public.property_status;
  previous_availability text;
  verified_at timestamptz;
begin
  if not private.has_staff_role(
    array['administrator', 'property_manager']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'property transition is not permitted';
  end if;

  select status, last_verified_at, availability_status
  into previous_status, verified_at, previous_availability
  from public.properties where id = p_property_id for update;
  if previous_status is null then
    raise no_data_found using message = 'property not found';
  end if;
  if not (
    (previous_status = 'draft' and p_status in ('under_review', 'archived'))
    or (previous_status = 'under_review' and p_status in ('draft', 'published', 'archived'))
    or (previous_status = 'published' and p_status in ('under_review', 'reserved', 'sold', 'archived'))
    or (previous_status = 'reserved' and p_status in ('published', 'sold', 'archived'))
    or (previous_status = 'sold' and p_status = 'archived')
  ) then
    raise check_violation using message = 'invalid property status transition';
  end if;
  if p_status = 'published' and verified_at is null then
    raise check_violation using message = 'property must be verified before publication';
  end if;

  update public.properties set
    status = p_status,
    published_at = case when p_status = 'published' then coalesce(published_at, now()) else published_at end,
    availability_status = 'unconfirmed',
    availability_checked_at = null,
    updated_by = actor
  where id = p_property_id;
  insert into public.audit_events
    (actor_id, entity_type, entity_id, action, previous_value, next_value)
  values (actor, 'property', p_property_id::text, 'status_changed',
    jsonb_build_object('status', previous_status, 'availability', previous_availability),
    jsonb_build_object('status', p_status, 'availability', 'unconfirmed'));
  return p_status;
end;
$$;

revoke all on function public.set_property_availability(uuid,text,boolean) from public, anon;
grant execute on function public.set_property_availability(uuid,text,boolean) to authenticated;
