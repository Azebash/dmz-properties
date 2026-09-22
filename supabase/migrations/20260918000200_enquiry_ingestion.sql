alter table public.enquiries
add column submission_key uuid not null unique;

create function public.ingest_enquiry(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  enquiry_id uuid;
  matched_property_id uuid;
begin
  select id into matched_property_id
  from public.properties
  where reference = nullif(payload ->> 'propertyReference', '');

  insert into public.enquiries (
    submission_key, enquiry_type, property_id, property_reference,
    name, email, phone, current_location, budget, purchase_timeline,
    inspection_preference, inspection_date, alternate_date, time_zone,
    preferred_contact_method, preferred_contact_time, message, attribution,
    privacy_consent_at
  ) values (
    (payload ->> 'submissionKey')::uuid,
    payload ->> 'interest',
    matched_property_id,
    nullif(payload ->> 'propertyReference', ''),
    payload ->> 'name',
    payload ->> 'email',
    payload ->> 'phone',
    nullif(payload ->> 'location', ''),
    nullif(payload ->> 'budget', ''),
    nullif(payload ->> 'timeline', ''),
    nullif(payload ->> 'inspectionPreference', ''),
    nullif(payload ->> 'inspectionDate', '')::date,
    nullif(payload ->> 'alternateDate', '')::date,
    nullif(payload ->> 'timeZone', ''),
    nullif(payload ->> 'contactMethod', ''),
    nullif(payload ->> 'contactTime', ''),
    payload ->> 'message',
    jsonb_build_object(
      'sourcePage', coalesce(payload ->> 'sourcePage', ''),
      'referrer', coalesce(payload ->> 'referrer', ''),
      'utmSource', coalesce(payload ->> 'utmSource', ''),
      'utmMedium', coalesce(payload ->> 'utmMedium', ''),
      'utmCampaign', coalesce(payload ->> 'utmCampaign', ''),
      'referralCode', coalesce(payload ->> 'referralCode', '')
    ),
    now()
  )
  on conflict (submission_key) do nothing
  returning id into enquiry_id;

  if enquiry_id is null then
    select id into enquiry_id
    from public.enquiries
    where submission_key = (payload ->> 'submissionKey')::uuid;
    return enquiry_id;
  end if;

  if payload ->> 'interest' = 'Booking an inspection' then
    insert into public.inspections (
      enquiry_id, property_id, inspection_type, preferred_date,
      alternate_date, time_zone
    ) values (
      enquiry_id,
      matched_property_id,
      payload ->> 'inspectionPreference',
      (payload ->> 'inspectionDate')::date,
      nullif(payload ->> 'alternateDate', '')::date,
      payload ->> 'timeZone'
    );
  end if;

  if payload ->> 'interest' = 'Selling my KYC Homes Phase II property' then
    insert into public.seller_submissions (
      enquiry_id, property_id, owner_name, owner_phone, owner_email,
      property_description
    ) values (
      enquiry_id,
      matched_property_id,
      payload ->> 'name',
      payload ->> 'phone',
      nullif(payload ->> 'email', ''),
      payload ->> 'message'
    );
  end if;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, next_value
  ) values (
    null,
    'enquiry',
    enquiry_id::text,
    'public_submission_created',
    jsonb_build_object('enquiryType', payload ->> 'interest')
  );

  return enquiry_id;
end;
$$;

revoke all on function public.ingest_enquiry(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_enquiry(jsonb) to service_role;
