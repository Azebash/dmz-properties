begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (id,email,email_confirmed_at,encrypted_password) values
  ('8d111111-1111-4111-8111-111111111111','media-manager@example.com',now(),'fixture-hash'),
  ('8d222222-2222-4222-8222-222222222222','media-viewer@example.com',now(),'fixture-hash');
insert into public.staff_profiles (user_id,display_name,role) values
  ('8d111111-1111-4111-8111-111111111111','Media Manager','property_manager'),
  ('8d222222-2222-4222-8222-222222222222','Media Viewer','viewer');
insert into public.properties (
  id, reference, slug, title, source, property_type, status,
  location_name, description, published_at, last_verified_at
) values (
  '8d333333-3333-4333-8333-333333333333','MEDIA-1','media-land','Verified estate plot',
  'developer_inventory','Land','published','KYC Homes Phase II',
  'A published property for private media workflow checks.',now(),now()
);
insert into public.properties (
  id, reference, slug, title, source, property_type, status,
  location_name, description, published_at, last_verified_at
) values (
  '8d555555-5555-4555-8555-555555555555','MEDIA-2','media-house','Verified developed home',
  'owner_resale','House','published','KYC Homes Phase II',
  'A developed property for classification change checks.',now(),now()
), (
  '8d666666-6666-4666-8666-666666666666','MEDIA-3','media-virgin-land','Verified virgin land',
  'owner_resale','Virgin Land','published','KYC Homes Phase II',
  'A land property with a descriptive type label.',now(),now()
);
insert into public.property_media (
  property_id,storage_path,media_type,alt_text,estate_context,verification_status
) values (
  '8d555555-5555-4555-8555-555555555555',
  '8d555555-5555-4555-8555-555555555555/8d999999-9999-4999-8999-999999999999.mp4',
  'video','A private video pending review',false,'submitted'
);

set local role anon;
select ok(not has_function_privilege('anon',
  'public.add_property_media(uuid,text,text,text,boolean)','execute'),
  'anonymous visitors cannot register uploaded media');
select ok(not has_table_privilege('anon','public.property_media','insert,update,delete'),
  'anonymous visitors cannot mutate media rows');

set local role authenticated;
set local request.jwt.claim.sub = '8d222222-2222-4222-8222-222222222222';
select throws_ok($$select public.add_property_media(
  '8d333333-3333-4333-8333-333333333333',
  '8d333333-3333-4333-8333-333333333333/8d444444-4444-4444-8444-444444444444.webp',
  'Actual estate streetscape',null,true)$$,
  '42501','property media editing is not permitted',
  'viewer cannot register media');

set local request.jwt.claim.sub = '8d111111-1111-4111-8111-111111111111';
select throws_ok($$select public.add_property_media(
  '8d333333-3333-4333-8333-333333333333',
  '8d333333-3333-4333-8333-333333333333/8d444444-4444-4444-8444-444444444444.webp',
  'Photo of an exact land plot',null,false)$$,
  '23514','land photographs must be estate context',
  'virgin land cannot be presented as a property-specific photograph');
select lives_ok($$select public.add_property_media(
  '8d333333-3333-4333-8333-333333333333',
  '8d333333-3333-4333-8333-333333333333/8d444444-4444-4444-8444-444444444444.webp',
  'Estate roads and houses', 'Genuine estate context', true)$$,
  'property manager registers private context photography');
select results_eq($$select verification_status::text from public.property_media
  where property_id='8d333333-3333-4333-8333-333333333333'$$,
  array['submitted'], 'uploaded media starts unapproved');

set local request.jwt.claim.sub = '8d222222-2222-4222-8222-222222222222';
select results_eq($$select count(*) from public.property_media
  where property_id='8d333333-3333-4333-8333-333333333333'$$,
  array[0::bigint], 'viewer cannot read unapproved photo metadata');

set local request.jwt.claim.sub = '8d111111-1111-4111-8111-111111111111';
select throws_ok($$select public.transition_property_media(
  (select id from public.property_media where property_id='8d333333-3333-4333-8333-333333333333'),
  'approved',false)$$,
  '23514','media approval requires rights confirmation',
  'approval requires an explicit image-rights confirmation');
select lives_ok($$select public.transition_property_media(
  (select id from public.property_media where property_id='8d333333-3333-4333-8333-333333333333'),
  'approved',true)$$,
  'confirmed photo can be approved');
set local role anon;
select results_eq($$select count(*) from public.property_media
  where property_id='8d333333-3333-4333-8333-333333333333'$$,
  array[1::bigint], 'anonymous readers see approved context photos for published property');

set local role authenticated;
set local request.jwt.claim.sub = '8d111111-1111-4111-8111-111111111111';
select results_eq($$select public.update_property_media(
  (select id from public.property_media where property_id='8d333333-3333-4333-8333-333333333333'),
  'Estate roads and houses','Genuine estate context',true,5)::text$$,
  array['approved'], 'reordering approved photos preserves their approval');
set local role anon;
select results_eq($$select count(*) from public.property_media
  where property_id='8d333333-3333-4333-8333-333333333333'$$,
  array[1::bigint], 'approved reordered photos stay publicly available');

set local role authenticated;
set local request.jwt.claim.sub = '8d111111-1111-4111-8111-111111111111';
select results_eq($$select public.update_property_media(
  (select id from public.property_media where property_id='8d333333-3333-4333-8333-333333333333'),
  'Estate context beside homes','Revised caption',true,2)::text$$,
  array['submitted'], 'editing approved photo details withdraws it for fresh review');
set local role anon;
select results_eq($$select count(*) from public.property_media
  where property_id='8d333333-3333-4333-8333-333333333333'$$,
  array[0::bigint], 'revised unapproved photo disappears from public reads');

set local role authenticated;
set local request.jwt.claim.sub = '8d111111-1111-4111-8111-111111111111';
select lives_ok($$select public.transition_property_media(
  (select id from public.property_media where property_id='8d333333-3333-4333-8333-333333333333'),
  'approved',true)$$,
  'edited photo can be reviewed and approved again');
select lives_ok($$select public.transition_property_media(
  (select id from public.property_media where property_id='8d333333-3333-4333-8333-333333333333'),
  'withdrawn',false)$$,
  'photo can be withdrawn without deleting private storage');
select throws_ok($$select public.add_property_media(
  '8d666666-6666-4666-8666-666666666666',
  '8d666666-6666-4666-8666-666666666666/8d777777-7777-4777-8777-777777777777.webp',
  'A claimed specific plot photo',null,false)$$,
  '23514','land photographs must be estate context',
  'the virgin-land media rule also covers descriptive property types');
select lives_ok($$select public.add_property_media(
  '8d555555-5555-4555-8555-555555555555',
  '8d555555-5555-4555-8555-555555555555/8d888888-8888-4888-8888-888888888888.webp',
  'The actual developed home for resale',null,false)$$,
  'a developed home can use a property-specific photo');
select throws_ok($$select public.transition_property_media(
  (select id from public.property_media where media_type='video'
    and property_id='8d555555-5555-4555-8555-555555555555'),
  'approved',true)$$,
  '23514',null,'videos cannot enter the image-only public gallery');
reset role;
select throws_ok($$update public.properties set property_type='Virgin Land'
  where id='8d555555-5555-4555-8555-555555555555'$$,
  '23514','reclassify property photos as estate context before changing to land',
  'changing a home to virgin land cannot leave a property-specific image attached');
set local role anon;
select results_eq($$select count(*) from public.property_media
  where property_id='8d333333-3333-4333-8333-333333333333'$$,
  array[0::bigint], 'withdrawn photo is invisible to anonymous readers');

reset role;
select results_eq($$select count(*) from public.audit_events
  where entity_type='property_media'$$,
  array[7::bigint], 'create, edit, approval and withdrawal are all audited');
select results_eq($$select public from storage.buckets where id='property-media'$$,
  array[false], 'property photo bucket remains private');

select * from finish();
rollback;
