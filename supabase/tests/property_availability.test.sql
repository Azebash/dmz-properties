begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id,email,email_confirmed_at,encrypted_password) values
  ('7a111111-1111-4111-8111-111111111111','availability-manager@example.com',now(),'fixture-hash'),
  ('7a222222-2222-4222-8222-222222222222','availability-viewer@example.com',now(),'fixture-hash');
insert into public.staff_profiles (user_id,display_name,role) values
  ('7a111111-1111-4111-8111-111111111111','Availability Manager','property_manager'),
  ('7a222222-2222-4222-8222-222222222222','Availability Viewer','viewer');
insert into public.properties (
  id, reference, slug, title, source, property_type, status,
  location_name, description, published_at, last_verified_at
) values (
  '7a333333-3333-4333-8333-333333333333','AVAIL-1','availability-fixture','Availability fixture',
  'developer_inventory','Land','published','KYC Homes Phase II',
  'A published property for inventory confirmation tests.',now(),now()
), (
  '7a444444-4444-4444-8444-444444444444','AVAIL-2','availability-draft','Draft availability fixture',
  'developer_inventory','Land','draft','KYC Homes Phase II',
  'A draft property cannot be confirmed available.',null,now()
);

select results_eq($$select availability_status from public.properties
  where reference='AVAIL-1'$$, array['unconfirmed'], 'published listings default to unconfirmed');
select results_eq($$select count(*) from public.properties
  where reference='AVAIL-1' and availability_checked_at is null$$,
  array[1::bigint], 'old published listings have no implied inventory check');

set local role anon;
select ok(not has_function_privilege('anon','public.set_property_availability(uuid,text,boolean)','execute'),
  'anonymous visitors cannot change inventory status');
set local role authenticated;
set local request.jwt.claim.sub = '7a222222-2222-4222-8222-222222222222';
select throws_ok($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','available',true)$$,
  '42501','property availability editing is not permitted','viewer cannot confirm stock');
set local request.jwt.claim.sub = '7a111111-1111-4111-8111-111111111111';
select ok(not has_table_privilege('authenticated','public.properties','update'),
  'property staff cannot directly forge a check timestamp');
select throws_ok($$select public.set_property_availability(
  '7a444444-4444-4444-8444-444444444444','available',true)$$,
  '23514','only published listings can have confirmed availability',
  'drafts cannot claim inventory availability');
select throws_ok($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','available',false)$$,
  '23514','availability confirmation is required','available requires a staff attestation');
select throws_ok($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','on_hold',false)$$,
  '23514','availability confirmation is required','on-hold requires a staff attestation');
select throws_ok($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','sold',true)$$,
  '23514','invalid availability status','unknown stock claims are rejected');
select results_eq($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','available',true)$$,
  array['available'], 'manager checks the current inventory');
select results_eq($$select count(*) from public.properties where reference='AVAIL-1'
  and availability_status='available' and availability_checked_at >= now() - interval '1 minute'$$,
  array[1::bigint], 'server records a fresh inventory check timestamp');
select results_eq($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','on_hold',true)$$,
  array['on_hold'], 'manager can mark confirmed stock on hold');
select results_eq($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','unconfirmed',false)$$,
  array['unconfirmed'], 'manager can revoke a previous confirmation');
select results_eq($$select count(*) from public.properties where reference='AVAIL-1'
  and availability_checked_at is null$$, array[1::bigint], 'revocation clears the check timestamp');
select results_eq($$select public.set_property_availability(
  '7a333333-3333-4333-8333-333333333333','available',true)$$,
  array['available'], 'manager can check availability again');
select results_eq($$select public.transition_property_status(
  '7a333333-3333-4333-8333-333333333333','reserved')::text$$,
  array['reserved'], 'reserving a listing moves it off the public catalogue');
select results_eq($$select public.transition_property_status(
  '7a333333-3333-4333-8333-333333333333','published')::text$$,
  array['published'], 'a reserved listing may return to publication');
select results_eq($$select count(*) from public.properties where reference='AVAIL-1'
  and availability_status='unconfirmed' and availability_checked_at is null$$,
  array[1::bigint], 'republication cannot restore a stale available claim');

select * from finish();
rollback;
