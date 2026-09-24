create function public.staff_directory()
returns table (
  user_id uuid, email text, display_name text, role public.staff_role,
  active boolean, created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.has_staff_role(array['administrator']::public.staff_role[]) then
    raise insufficient_privilege using message = 'staff directory is restricted to administrators';
  end if;
  return query
    select p.user_id, u.email::text, p.display_name, p.role,
      p.active, p.created_at, p.updated_at
    from public.staff_profiles p
    join auth.users u on u.id = p.user_id
    order by p.created_at desc
    limit 200;
end;
$$;

create function public.manage_staff_profile(
  p_user_id uuid, p_display_name text, p_role public.staff_role, p_active boolean
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.staff_profiles%rowtype;
  next_row public.staff_profiles%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(9121009, 1);
  if not private.has_staff_role(array['administrator']::public.staff_role[]) then
    raise insufficient_privilege using message = 'staff management is restricted to administrators';
  end if;
  if p_user_id is null or p_role is null or p_active is null
    or char_length(trim(coalesce(p_display_name, ''))) not between 2 and 120 then
    raise check_violation using message = 'staff profile details are invalid';
  end if;
  if p_user_id = actor and (p_role <> 'administrator' or not p_active) then
    raise check_violation using message = 'administrators cannot remove their own access';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise no_data_found using message = 'auth user does not exist';
  end if;

  select * into previous_row from public.staff_profiles
  where user_id = p_user_id for update;
  if previous_row.user_id is not null and previous_row.role = 'administrator'
    and previous_row.active and (p_role <> 'administrator' or not p_active)
    and (select count(*) from public.staff_profiles
      where role = 'administrator' and active) <= 1 then
    raise check_violation using message = 'the last administrator must remain active';
  end if;
  if (not p_active or p_role not in ('administrator', 'property_manager'))
    and (exists (select 1 from public.enquiries where assigned_to = p_user_id)
      or exists (select 1 from public.inspections where assigned_to = p_user_id)) then
    raise check_violation using message = 'reassign staff work before changing access';
  end if;
  if previous_row.user_id is not null and previous_row.role = p_role
    and previous_row.active = p_active
    and previous_row.display_name = trim(p_display_name) then
    return p_user_id;
  end if;

  insert into public.staff_profiles (user_id, display_name, role, active)
  values (p_user_id, trim(p_display_name), p_role, p_active)
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    role = excluded.role,
    active = excluded.active
  returning * into next_row;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'staff_profile', p_user_id::text,
    case when previous_row.user_id is null then 'created' else 'updated' end,
    case when previous_row.user_id is null then null else
      jsonb_build_object('displayName', previous_row.display_name,
        'role', previous_row.role, 'active', previous_row.active) end,
    jsonb_build_object('displayName', next_row.display_name,
      'role', next_row.role, 'active', next_row.active)
  );
  return p_user_id;
end;
$$;

create function public.assign_enquiry_staff(p_enquiry_id uuid, p_assignee uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_assignee uuid;
  appointment record;
begin
  perform pg_catalog.pg_advisory_xact_lock(9121009, 1);
  if not private.has_staff_role(array['administrator']::public.staff_role[]) then
    raise insufficient_privilege using message = 'lead assignment is restricted to administrators';
  end if;
  if p_assignee is not null and not exists (
    select 1 from public.staff_profiles
    where user_id = p_assignee and active
      and role in ('administrator', 'property_manager')
  ) then
    raise check_violation using message = 'assignee must be an active property staff member';
  end if;
  select assigned_to into previous_assignee from public.enquiries
  where id = p_enquiry_id for update;
  if not found then raise no_data_found using message = 'enquiry not found'; end if;
  if previous_assignee is distinct from p_assignee then
    update public.enquiries set assigned_to = p_assignee where id = p_enquiry_id;
    insert into public.audit_events (
      actor_id, entity_type, entity_id, action, previous_value, next_value
    ) values (
      actor, 'enquiry', p_enquiry_id::text, 'assigned',
      jsonb_build_object('assignedTo', previous_assignee),
      jsonb_build_object('assignedTo', p_assignee)
    );
  end if;

  for appointment in
    select id, assigned_to from public.inspections
    where enquiry_id = p_enquiry_id for update
  loop
    if appointment.assigned_to is distinct from p_assignee then
      update public.inspections set assigned_to = p_assignee where id = appointment.id;
      insert into public.audit_events (
        actor_id, entity_type, entity_id, action, previous_value, next_value
      ) values (
        actor, 'inspection', appointment.id::text, 'assigned',
        jsonb_build_object('assignedTo', appointment.assigned_to),
        jsonb_build_object('assignedTo', p_assignee)
      );
    end if;
  end loop;
  return p_assignee;
end;
$$;

revoke all on function public.staff_directory() from public, anon;
revoke all on function public.manage_staff_profile(uuid,text,public.staff_role,boolean) from public, anon;
revoke all on function public.assign_enquiry_staff(uuid,uuid) from public, anon;
grant execute on function public.staff_directory() to authenticated;
grant execute on function public.manage_staff_profile(uuid,text,public.staff_role,boolean) to authenticated;
grant execute on function public.assign_enquiry_staff(uuid,uuid) to authenticated;
