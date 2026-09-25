create table public.lead_routing_settings (
  singleton boolean primary key default true check (singleton),
  default_assignee uuid references public.staff_profiles(user_id) on delete set null,
  updated_by uuid references public.staff_profiles(user_id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.lead_routing_settings (singleton) values (true);
alter table public.lead_routing_settings enable row level security;
revoke all on table public.lead_routing_settings from public, anon, authenticated;

create function public.get_default_lead_owner()
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
  if configured_owner is not null then return configured_owner; end if;
  select count(*)::integer, (array_agg(p.user_id order by p.user_id))[1]
    into eligible_count, sole_owner
  from public.staff_profiles p join auth.users u on u.id = p.user_id
  where p.active and p.role in ('administrator', 'property_manager')
    and u.email_confirmed_at is not null and nullif(u.encrypted_password, '') is not null
    and (u.banned_until is null or u.banned_until <= now());
  return case when eligible_count = 1 then sole_owner else null end;
end;
$$;

create function public.set_default_lead_owner(p_assignee uuid, p_assign_existing boolean)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_owner uuid;
  enquiry record;
  inspection record;
begin
  perform pg_catalog.pg_advisory_xact_lock(9121009, 1);
  if not private.has_staff_role(array['administrator']::public.staff_role[]) then
    raise insufficient_privilege using message = 'lead routing settings are restricted to administrators';
  end if;
  if p_assignee is not null and not exists (
    select 1 from public.staff_profiles p join auth.users u on u.id = p.user_id
    where p.user_id = p_assignee and p.active
      and p.role in ('administrator', 'property_manager')
      and u.email_confirmed_at is not null and nullif(u.encrypted_password, '') is not null
      and (u.banned_until is null or u.banned_until <= now())
  ) then
    raise check_violation using message = 'default owner must be an active property operator';
  end if;
  if p_assign_existing and p_assignee is null then
    raise check_violation using message = 'choose a default owner before assigning existing leads';
  end if;

  select default_assignee into previous_owner from public.lead_routing_settings
  where singleton for update;
  update public.lead_routing_settings set
    default_assignee = p_assignee, updated_by = actor, updated_at = now()
  where singleton;
  if previous_owner is distinct from p_assignee then
    insert into public.audit_events (actor_id, entity_type, entity_id, action, previous_value, next_value)
    values (actor, 'lead_routing', 'default', 'default_owner_changed',
      jsonb_build_object('assignee', previous_owner),
      jsonb_build_object('assignee', p_assignee));
  end if;

  if p_assign_existing then
    for enquiry in
      update public.enquiries set assigned_to = p_assignee
      where assigned_to is null and status in ('new', 'qualified', 'inspection', 'offer')
      returning id
    loop
      insert into public.audit_events (actor_id, entity_type, entity_id, action, previous_value, next_value)
      values (actor, 'enquiry', enquiry.id::text, 'assigned',
        jsonb_build_object('assignedTo', null),
        jsonb_build_object('assignedTo', p_assignee, 'reason', 'default_owner_setup'));
      for inspection in
        update public.inspections set assigned_to = p_assignee
        where enquiry_id = enquiry.id and assigned_to is null
        returning id
      loop
        insert into public.audit_events (actor_id, entity_type, entity_id, action, previous_value, next_value)
        values (actor, 'inspection', inspection.id::text, 'assigned',
          jsonb_build_object('assignedTo', null),
          jsonb_build_object('assignedTo', p_assignee, 'reason', 'default_owner_setup'));
      end loop;
    end loop;
  end if;
  return p_assignee;
end;
$$;

create or replace function public.ingest_enquiry(payload jsonb)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  enquiry_id uuid;
  matched_property_id uuid;
  assigned_owner uuid;
  configured_owner uuid;
  eligible_count integer;
  sole_owner uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(9121009, 1);
  select id into matched_property_id from public.properties
  where reference = nullif(payload ->> 'propertyReference', '');

  select default_assignee into configured_owner
  from public.lead_routing_settings where singleton;
  if configured_owner is not null then
    if exists (
      select 1 from public.staff_profiles p join auth.users u on u.id = p.user_id
      where p.user_id = configured_owner and p.active
        and p.role in ('administrator', 'property_manager')
        and u.email_confirmed_at is not null and nullif(u.encrypted_password, '') is not null
        and (u.banned_until is null or u.banned_until <= now())
    ) then assigned_owner := configured_owner;
    end if;
  else
    select count(*)::integer, (array_agg(p.user_id order by p.user_id))[1]
      into eligible_count, sole_owner
    from public.staff_profiles p join auth.users u on u.id = p.user_id
    where p.active and p.role in ('administrator', 'property_manager')
      and u.email_confirmed_at is not null and nullif(u.encrypted_password, '') is not null
      and (u.banned_until is null or u.banned_until <= now());
    if eligible_count = 1 then assigned_owner := sole_owner; end if;
  end if;

  insert into public.enquiries (
    submission_key, enquiry_type, property_id, property_reference,
    name, email, phone, current_location, budget, purchase_timeline,
    inspection_preference, inspection_date, alternate_date, time_zone,
    preferred_contact_method, preferred_contact_time, message, attribution,
    privacy_consent_at, assigned_to
  ) values (
    (payload ->> 'submissionKey')::uuid,
    payload ->> 'interest', matched_property_id,
    nullif(payload ->> 'propertyReference', ''), payload ->> 'name', payload ->> 'email',
    payload ->> 'phone', nullif(payload ->> 'location', ''), nullif(payload ->> 'budget', ''),
    nullif(payload ->> 'timeline', ''), nullif(payload ->> 'inspectionPreference', ''),
    nullif(payload ->> 'inspectionDate', '')::date, nullif(payload ->> 'alternateDate', '')::date,
    nullif(payload ->> 'timeZone', ''), nullif(payload ->> 'contactMethod', ''),
    nullif(payload ->> 'contactTime', ''), payload ->> 'message',
    jsonb_build_object(
      'sourcePage', coalesce(payload ->> 'sourcePage', ''),
      'referrer', coalesce(payload ->> 'referrer', ''),
      'utmSource', coalesce(payload ->> 'utmSource', ''),
      'utmMedium', coalesce(payload ->> 'utmMedium', ''),
      'utmCampaign', coalesce(payload ->> 'utmCampaign', ''),
      'referralCode', coalesce(payload ->> 'referralCode', '')
    ), now(), assigned_owner
  ) on conflict (submission_key) do nothing returning id into enquiry_id;

  if enquiry_id is null then
    select id into enquiry_id from public.enquiries
    where submission_key = (payload ->> 'submissionKey')::uuid;
    return enquiry_id;
  end if;
  if payload ->> 'interest' = 'Booking an inspection' then
    insert into public.inspections (
      enquiry_id, property_id, inspection_type, preferred_date, alternate_date, time_zone, assigned_to
    ) values (
      enquiry_id, matched_property_id, payload ->> 'inspectionPreference',
      (payload ->> 'inspectionDate')::date, nullif(payload ->> 'alternateDate', '')::date,
      payload ->> 'timeZone', assigned_owner
    );
  end if;
  if payload ->> 'interest' = 'Selling my KYC Homes Phase II property' then
    insert into public.seller_submissions (
      enquiry_id, property_id, owner_name, owner_phone, owner_email, property_description
    ) values (
      enquiry_id, matched_property_id, payload ->> 'name', payload ->> 'phone',
      nullif(payload ->> 'email', ''), payload ->> 'message'
    );
  end if;
  insert into public.audit_events (actor_id, entity_type, entity_id, action, next_value)
  values (null, 'enquiry', enquiry_id::text, 'public_submission_created',
    jsonb_build_object('enquiryType', payload ->> 'interest', 'assignedTo', assigned_owner));
  return enquiry_id;
end;
$$;

revoke all on function public.get_default_lead_owner() from public, anon;
revoke all on function public.set_default_lead_owner(uuid,boolean) from public, anon;
grant execute on function public.get_default_lead_owner() to authenticated;
grant execute on function public.set_default_lead_owner(uuid,boolean) to authenticated;
revoke all on function public.ingest_enquiry(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_enquiry(jsonb) to service_role;
