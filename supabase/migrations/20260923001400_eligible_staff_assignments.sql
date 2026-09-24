drop function public.staff_directory();

create function public.staff_directory()
returns table (
  user_id uuid, email text, display_name text, role public.staff_role,
  active boolean, auth_eligible boolean, created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.has_staff_role(array['administrator']::public.staff_role[]) then
    raise insufficient_privilege using message = 'staff directory is restricted to administrators';
  end if;
  return query
    select p.user_id, u.email::text, p.display_name, p.role, p.active,
      (u.email_confirmed_at is not null
        and nullif(u.encrypted_password, '') is not null
        and (u.banned_until is null or u.banned_until <= now())),
      p.created_at, p.updated_at
    from public.staff_profiles p
    join auth.users u on u.id = p.user_id
    order by p.created_at desc;
end;
$$;

revoke all on function public.staff_directory() from public, anon;
grant execute on function public.staff_directory() to authenticated;

create or replace function public.assign_enquiry_staff(p_enquiry_id uuid, p_assignee uuid)
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
    select 1 from public.staff_profiles p
    join auth.users u on u.id = p.user_id
    where p.user_id = p_assignee and p.active
      and p.role in ('administrator', 'property_manager')
      and u.email_confirmed_at is not null
      and nullif(u.encrypted_password, '') is not null
      and (u.banned_until is null or u.banned_until <= now())
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
