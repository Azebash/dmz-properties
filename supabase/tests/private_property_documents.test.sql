begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id,email,email_confirmed_at,encrypted_password) values
  ('9e111111-1111-4111-8111-111111111111','document-manager@example.com',now(),'fixture-hash'),
  ('9e222222-2222-4222-8222-222222222222','document-viewer@example.com',now(),'fixture-hash');
insert into public.staff_profiles (user_id,display_name,role) values
  ('9e111111-1111-4111-8111-111111111111','Document Manager','property_manager'),
  ('9e222222-2222-4222-8222-222222222222','Document Viewer','viewer');
insert into public.properties (
  id, reference, slug, title, source, property_type, status,
  location_name, description, published_at, last_verified_at
) values (
  '9e333333-3333-4333-8333-333333333333','DOC-1','document-plot','Document fixture',
  'developer_inventory','Land','published','KYC Homes Phase II',
  'A published property with private documents.',now(),now()
);

set local role anon;
select ok(not has_table_privilege('anon','public.property_documents','select,insert,update,delete'),
  'anonymous visitors have no document table privileges');
select ok(not has_function_privilege('anon','public.add_property_document(uuid,text,text,text,text)','execute'),
  'anonymous visitors cannot register private documents');
select ok(not has_function_privilege('anon','public.transition_property_document(uuid,public.verification_status,boolean)','execute'),
  'anonymous visitors cannot review documents');

set local role authenticated;
set local request.jwt.claim.sub = '9e222222-2222-4222-8222-222222222222';
select results_eq($$select count(*) from public.property_documents$$,
  array[0::bigint], 'viewer cannot read property document metadata');
select throws_ok($$select public.add_property_document(
  '9e333333-3333-4333-8333-333333333333',
  '9e333333-3333-4333-8333-333333333333/9e444444-4444-4444-8444-444444444444.pdf',
  'offer_letter','Private offer letter',null)$$,
  '42501','property document editing is not permitted','viewer cannot register documents');

set local request.jwt.claim.sub = '9e111111-1111-4111-8111-111111111111';
select throws_ok($$select public.add_property_document(
  '9e333333-3333-4333-8333-333333333333',
  '9e333333-3333-4333-8333-333333333333/9e444444-4444-4444-8444-444444444444.webp',
  'offer_letter','Private offer letter',null)$$,
  '23514','document fields are invalid','photos cannot be registered as offer letters');
select throws_ok($$select public.add_property_document(
  '9e333333-3333-4333-8333-333333333333',
  '9e333333-3333-4333-8333-333333333333/9e444444-4444-4444-8444-444444444444.pdf',
  'public_media','Private offer letter',null)$$,
  '23514','document fields are invalid','unknown document categories are rejected');
select lives_ok($$select public.add_property_document(
  '9e333333-3333-4333-8333-333333333333',
  '9e333333-3333-4333-8333-333333333333/9e444444-4444-4444-8444-444444444444.pdf',
  'offer_letter','Private offer letter','Review privately')$$,
  'property manager registers a private document');
select results_eq($$select verification_status::text from public.property_documents$$,
  array['submitted'], 'new documents begin under review');

set local request.jwt.claim.sub = '9e222222-2222-4222-8222-222222222222';
select results_eq($$select count(*) from public.property_documents$$,
  array[0::bigint], 'published parent does not expose document metadata to viewers');
set local request.jwt.claim.sub = '9e111111-1111-4111-8111-111111111111';
select results_eq($$select count(*) from public.property_documents$$,
  array[1::bigint], 'property manager can inspect private document metadata');
select throws_ok($$select public.transition_property_document(
  (select id from public.property_documents), 'approved', false)$$,
  '23514','document review requires confirmation','verification requires inspection confirmation');
select lives_ok($$select public.transition_property_document(
  (select id from public.property_documents), 'approved', true)$$,
  'a reviewed document can be internally verified');
set local request.jwt.claim.sub = '9e222222-2222-4222-8222-222222222222';
select results_eq($$select count(*) from public.property_documents$$,
  array[0::bigint], 'verified document remains hidden from viewers');
set local request.jwt.claim.sub = '9e111111-1111-4111-8111-111111111111';
select results_eq($$select public.update_property_document(
  (select id from public.property_documents), 'survey_plan','Updated survey plan','Changed classification')::text$$,
  array['submitted'], 'editing a verified classification returns it to review');
select lives_ok($$select public.transition_property_document(
  (select id from public.property_documents), 'approved', true)$$,
  'revised document can be verified again');
select lives_ok($$select public.transition_property_document(
  (select id from public.property_documents), 'withdrawn', false)$$,
  'verified document can be withdrawn from current review');
select throws_ok($$select public.transition_property_document(
  (select id from public.property_documents), 'approved', true)$$,
  '23514','invalid document status transition','withdrawn document cannot bypass review');

reset role;
select results_eq($$select count(*) from public.audit_events where entity_type='property_document'$$,
  array[5::bigint], 'registration, edits and status transitions are audited');
select results_eq($$select public from storage.buckets where id='property-documents'$$,
  array[false], 'property document bucket is never public');
select results_eq($$select file_size_limit from storage.buckets where id='property-documents'$$,
  array[3145728::bigint], 'property document bucket enforces the 3 MB file limit');

select * from finish();
rollback;
