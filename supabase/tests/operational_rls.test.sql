begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'viewer@example.com');

insert into public.staff_profiles (user_id, display_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin User', 'administrator'),
  ('22222222-2222-2222-2222-222222222222', 'Viewer User', 'viewer');

insert into public.properties (
  id, reference, slug, title, source, property_type, status,
  location_name, description, published_at
)
values
  ('33333333-3333-3333-3333-333333333333', 'PUB-1', 'published-property', 'Published', 'developer_inventory', 'Land', 'published', 'Abuja', 'Published property', now()),
  ('44444444-4444-4444-4444-444444444444', 'DRAFT-1', 'draft-property', 'Draft', 'owner_resale', 'Land', 'draft', 'Abuja', 'Draft property', null);

set local role anon;
select results_eq(
  $$select reference from public.properties where reference in ('PUB-1', 'DRAFT-1') order by reference$$,
  array['PUB-1'],
  'anonymous visitors read only published properties'
);
select ok(
  not has_table_privilege('anon', 'public.properties', 'insert,update,delete'),
  'anonymous visitors hold no property write grants'
);
select throws_ok(
  $$select * from public.enquiries$$,
  '42501',
  null,
  'anonymous visitors cannot read enquiries'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select results_eq(
  $$select reference from public.properties where reference in ('PUB-1', 'DRAFT-1') order by reference$$,
  array['DRAFT-1', 'PUB-1'],
  'active staff can read draft and published properties'
);
select throws_ok(
  $$insert into public.properties (reference, slug, title, source, property_type, location_name, description)
    values ('DENIED', 'denied', 'Denied', 'developer_inventory', 'Land', 'Abuja', 'Denied')$$,
  '42501',
  null,
  'viewer cannot create properties'
);
select throws_ok(
  $$update public.properties set title = 'Stolen' where reference = 'DRAFT-1' returning reference$$,
  '42501',
  null,
  'viewer cannot update properties'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$insert into public.properties (reference, slug, title, source, property_type, location_name, description)
    values ('ADMIN-1', 'admin-created', 'Admin created', 'developer_inventory', 'Land', 'Abuja', 'Created')$$,
  '42501',
  null,
  'administrator cannot bypass future audited mutation RPCs'
);
select throws_ok(
  $$update public.properties set title = 'Reviewed' where reference = 'DRAFT-1' returning title$$,
  '42501',
  null,
  'administrator cannot update directly through the Data API'
);
select ok(
  private.has_staff_role(array['administrator']::public.staff_role[]),
  'administrator role helper returns true'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'insert,update,delete'),
  'staff cannot forge audit events through the Data API'
);
select ok(
  not has_function_privilege('anon', 'public.ingest_enquiry(jsonb)', 'execute'),
  'anonymous callers cannot execute enquiry ingestion'
);
select ok(
  not has_function_privilege('authenticated', 'public.ingest_enquiry(jsonb)', 'execute'),
  'authenticated callers cannot execute service ingestion directly'
);
select ok(
  has_function_privilege('service_role', 'public.ingest_enquiry(jsonb)', 'execute'),
  'service role can execute enquiry ingestion'
);

reset role;
select results_eq(
  $$select public from storage.buckets where id = 'property-media'$$,
  array[false],
  'property media bucket is private'
);
select results_eq(
  $$select public from storage.buckets where id = 'seller-documents'$$,
  array[false],
  'seller documents bucket is private'
);

set local role service_role;
select lives_ok(
  $$select public.ingest_enquiry('{"submissionKey":"55555555-5555-4555-8555-555555555555","name":"Test Buyer","email":"buyer@example.com","phone":"+2348000000000","location":"Abuja","interest":"Booking an inspection","timeline":"Within 3 months","budget":"NGN 14000000","propertyReference":"DMZ-KYC-001","inspectionPreference":"Live video inspection","inspectionDate":"2026-12-15","alternateDate":"2026-12-16","timeZone":"Africa/Lagos","contactMethod":"WhatsApp","contactTime":"Morning","message":"Remote inspection test request","sourcePage":"https://example.com/properties","referrer":"","utmSource":"test","utmMedium":"test","utmCampaign":"rls","referralCode":"","consent":"accepted"}'::jsonb)$$,
  'service role ingests a validated inspection enquiry'
);
select results_eq(
  $$select count(*) from public.enquiries where submission_key = '55555555-5555-4555-8555-555555555555'::uuid$$,
  array[1::bigint],
  'ingestion creates one enquiry'
);
select lives_ok(
  $$select public.ingest_enquiry('{"submissionKey":"55555555-5555-4555-8555-555555555555","name":"Test Buyer","email":"buyer@example.com","phone":"+2348000000000","location":"Abuja","interest":"Booking an inspection","timeline":"Within 3 months","budget":"NGN 14000000","propertyReference":"DMZ-KYC-001","inspectionPreference":"Live video inspection","inspectionDate":"2026-12-15","alternateDate":"2026-12-16","timeZone":"Africa/Lagos","contactMethod":"WhatsApp","contactTime":"Morning","message":"Remote inspection test request","sourcePage":"https://example.com/properties","referrer":"","utmSource":"test","utmMedium":"test","utmCampaign":"rls","referralCode":"","consent":"accepted"}'::jsonb)$$,
  'repeated submission is accepted idempotently'
);
select results_eq(
  $$select count(*) from public.enquiries where submission_key = '55555555-5555-4555-8555-555555555555'::uuid$$,
  array[1::bigint],
  'idempotent retry creates no duplicate enquiry'
);
select results_eq(
  $$select count(*) from public.inspections i join public.enquiries e on e.id = i.enquiry_id where e.submission_key = '55555555-5555-4555-8555-555555555555'::uuid$$,
  array[1::bigint],
  'inspection enquiry creates one inspection record'
);
select results_eq(
  $$select count(*) from public.audit_events a join public.enquiries e on e.id::text = a.entity_id where e.submission_key = '55555555-5555-4555-8555-555555555555'::uuid$$,
  array[1::bigint],
  'ingestion creates one audit event'
);

select * from finish();
rollback;
