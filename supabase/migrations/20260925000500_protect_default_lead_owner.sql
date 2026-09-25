create or replace function public.get_default_lead_owner()
returns uuid language plpgsql stable security definer set search_path = ''
as $$
declare
  configured_owner uuid;
  eligible_count integer;
  sole_owner uuid;
begin
  if not private.has_staff_role(array['administrator']::public.staff_role[]) then
    raise insufficient_privilege using message = 'lead routing settings are restricted to administrators';
  end if;
  select default_assignee into configured_owner
  from public.lead_routing_settings where singleton;
  if configured_owner is not null then
    if exists (
      select 1 from public.staff_profiles p join auth.users u on u.id = p.user_id
      where p.user_id = configured_owner and p.active
        and p.role in ('administrator', 'property_manager')
        and u.email_confirmed_at is not null and nullif(u.encrypted_password, '') is not null
        and (u.banned_until is null or u.banned_until <= now())
    ) then return configured_owner; end if;
    return null;
  end if;
  select count(*)::integer, (array_agg(p.user_id order by p.user_id))[1]
    into eligible_count, sole_owner
  from public.staff_profiles p join auth.users u on u.id = p.user_id
  where p.active and p.role in ('administrator', 'property_manager')
    and u.email_confirmed_at is not null and nullif(u.encrypted_password, '') is not null
    and (u.banned_until is null or u.banned_until <= now());
  return case when eligible_count = 1 then sole_owner else null end;
end;
$$;

create function private.prevent_default_lead_owner_deactivation()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.lead_routing_settings
    where singleton and default_assignee = old.user_id
  ) and (not new.active or new.role not in ('administrator', 'property_manager')) then
    raise check_violation using message = 'clear the default lead owner before disabling or changing their role';
  end if;
  return new;
end;
$$;
create trigger protect_default_lead_owner before update of active, role
on public.staff_profiles for each row execute function private.prevent_default_lead_owner_deactivation();
revoke all on function private.prevent_default_lead_owner_deactivation() from public, anon, authenticated;
