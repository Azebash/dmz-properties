begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'viewer@example.com'),
  ('66666666-6666-6666-8666-666666666666', 'manager@example.com');
update auth.users set email_confirmed_at = now(), encrypted_password = 'fixture-hash'
where id in ('11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-8666-666666666666');

insert into public.staff_profiles (user_id, display_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin User', 'administrator'),
  ('22222222-2222-2222-2222-222222222222', 'Viewer User', 'viewer'),
  ('66666666-6666-6666-8666-666666666666', 'Manager User', 'property_manager');

insert into public.properties (
  id, reference, slug, title, source, property_type, status,
  location_name, description, published_at, last_verified_at
)
values
  ('33333333-3333-3333-3333-333333333333', 'PUB-1', 'published-property', 'Published', 'developer_inventory', 'Land', 'published', 'Abuja', 'Published property', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'DRAFT-1', 'draft-property', 'Draft', 'owner_resale', 'Land', 'draft', 'Abuja', 'Draft property', null, null);

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

reset role;
select ok(
  not has_function_privilege('anon', 'public.check_enquiry_rate_limit(text,integer,integer)', 'execute'),
  'anonymous callers cannot execute distributed rate limiting'
);
select ok(
  not has_function_privilege('authenticated', 'public.check_enquiry_rate_limit(text,integer,integer)', 'execute'),
  'authenticated callers cannot execute distributed rate limiting'
);
select ok(
  has_function_privilege('service_role', 'public.check_enquiry_rate_limit(text,integer,integer)', 'execute'),
  'service role can execute distributed rate limiting'
);
select ok(
  not has_table_privilege('anon', 'private.enquiry_rate_limits', 'select,insert,update,delete'),
  'anonymous callers hold no rate-limit table privileges'
);
set local role service_role;
select results_eq(
  $$select public.check_enquiry_rate_limit(repeat('a', 64), 5, 60) from generate_series(1, 6)$$,
  array[false, false, false, false, false, true],
  'shared limiter blocks the sixth request in a window'
);

reset role;
select ok(
  not has_function_privilege('anon', 'public.save_property(jsonb)', 'execute'),
  'anonymous callers cannot execute property mutations'
);
select ok(
  has_function_privilege('authenticated', 'public.save_property(jsonb)', 'execute'),
  'authenticated role can reach the role-checked property RPC'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select throws_ok(
  $$select public.save_property('{"reference":"RPC-DENIED","slug":"rpc-denied","title":"Denied","source":"developer_inventory","propertyType":"Land","locationName":"Abuja","description":"Denied mutation","features":[]}'::jsonb)$$,
  '42501',
  'property mutation is not permitted',
  'viewer cannot use property mutation RPC'
);

set local request.jwt.claim.sub = '66666666-6666-6666-8666-666666666666';
select lives_ok(
  $$select public.save_property('{"reference":"RPC-1","slug":"rpc-created-property","title":"RPC Created Property","source":"developer_inventory","propertyType":"Land","locationName":"Abuja","description":"Audited property mutation","features":["Verified"],"lastVerifiedAt":"2026-09-22T00:00:00Z"}'::jsonb)$$,
  'property manager creates a draft through the audited RPC'
);
select results_eq(
  $$select status::text from public.properties where reference = 'RPC-1'$$,
  array['draft'],
  'new RPC property starts in draft status'
);
reset role;
select results_eq(
  $$select count(*) from public.audit_events where entity_type = 'property' and action = 'created' and entity_id = (select id::text from public.properties where reference = 'RPC-1')$$,
  array[1::bigint],
  'property creation records one audit event'
);
set local role authenticated;
set local request.jwt.claim.sub = '66666666-6666-6666-8666-666666666666';
select results_eq(
  $$select public.transition_property_status((select id from public.properties where reference = 'RPC-1'), 'under_review')::text$$,
  array['under_review'],
  'property manager moves draft to review'
);
select results_eq(
  $$select public.transition_property_status((select id from public.properties where reference = 'RPC-1'), 'published')::text$$,
  array['published'],
  'verified reviewed property can be published'
);
select results_eq(
  $$select status::text from public.properties where reference = 'RPC-1'$$,
  array['published'],
  'published status is persisted'
);
select throws_ok(
  $$select public.transition_property_status((select id from public.properties where reference = 'RPC-1'), 'draft')$$,
  '23514',
  'invalid property status transition',
  'invalid publication rollback is rejected'
);
select throws_ok(
  $$select public.save_property(jsonb_set(
    '{"reference":"RPC-1","slug":"renamed-property","title":"RPC Created Property","source":"developer_inventory","propertyType":"Land","locationName":"Abuja","description":"Audited property mutation","features":["Verified"],"lastVerifiedAt":"2026-09-22T00:00:00Z"}'::jsonb,
    '{id}', to_jsonb((select id::text from public.properties where reference='RPC-1'))))$$,
  '23514', 'published property URLs and references cannot change',
  'published property URL cannot be changed by an otherwise authorized editor'
);
select throws_ok(
  $$select public.save_property(jsonb_set(
    '{"reference":"RPC-CHANGED","slug":"rpc-created-property","title":"RPC Created Property","source":"developer_inventory","propertyType":"Land","locationName":"Abuja","description":"Audited property mutation","features":["Verified"],"lastVerifiedAt":"2026-09-22T00:00:00Z"}'::jsonb,
    '{id}', to_jsonb((select id::text from public.properties where reference='RPC-1'))))$$,
  '23514', 'published property URLs and references cannot change',
  'published property reference cannot silently change buyer enquiry context'
);
select lives_ok(
  $$select public.save_property(jsonb_set(
    '{"reference":"RPC-1","slug":"rpc-created-property","title":"Authorized Current Listing Edit","source":"developer_inventory","propertyType":"Land","locationName":"Abuja","description":"Audited property mutation","features":["Verified"],"lastVerifiedAt":"2026-09-22T00:00:00Z"}'::jsonb,
    '{id}', to_jsonb((select id::text from public.properties where reference='RPC-1'))))$$,
  'property manager can still edit the current approved listing with an audit trail'
);
select results_eq(
  $$select title from public.properties where reference='RPC-1'$$,
  array['Authorized Current Listing Edit'],
  'authorized published property edit is persisted'
);
select throws_ok(
  $$select public.save_property(jsonb_set(
    '{"reference":"RPC-1","slug":"rpc-created-property","title":"Unauthorized Unverified Edit","source":"developer_inventory","propertyType":"Land","locationName":"Abuja","description":"Audited property mutation","features":["Verified"],"lastVerifiedAt":""}'::jsonb,
    '{id}', to_jsonb((select id::text from public.properties where reference='RPC-1'))))$$,
  '23514', null,
  'editing a published property cannot clear its verification date'
);

select * from finish();
rollback;
