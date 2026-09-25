begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id,email,email_confirmed_at,encrypted_password) values
  ('5c111111-1111-4111-8111-111111111111','routing-admin@example.com',now(),'fixture-hash'),
  ('5c222222-2222-4222-8222-222222222222','routing-manager-one@example.com',now(),'fixture-hash'),
  ('5c333333-3333-4333-8333-333333333333','routing-manager-two@example.com',now(),'fixture-hash'),
  ('5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','routing-manager-three@example.com',now(),'fixture-hash'),
  ('5c444444-4444-4444-8444-444444444444','routing-viewer@example.com',now(),'fixture-hash');
insert into public.staff_profiles (user_id,display_name,role) values
  ('5c111111-1111-4111-8111-111111111111','Routing Admin','administrator'),
  ('5c222222-2222-4222-8222-222222222222','Operator One','property_manager'),
  ('5c333333-3333-4333-8333-333333333333','Operator Two','property_manager'),
  ('5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Operator Three','property_manager'),
  ('5c444444-4444-4444-8444-444444444444','Routing Viewer','viewer');
insert into public.enquiries (
  id,submission_key,enquiry_type,name,email,phone,message,privacy_consent_at,assigned_to
) values
  ('5c555555-5555-4555-8555-555555555555','5c666666-6666-4666-8666-666666666666',
   'Booking an inspection','Unassigned Open','open@example.com','+2348000000000','Open lead',now(),null),
  ('5c777777-7777-4777-8777-777777777777','5c888888-8888-4888-8888-888888888888',
   'Buying a plot','Already Assigned','assigned@example.com','+2348000000000','Keep existing owner',now(),
   '5c333333-3333-4333-8333-333333333333'),
  ('5c999999-9999-4999-8999-999999999999','5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Buying a plot','Closed Lead','closed@example.com','+2348000000000','Closed lead',now(),null);
update public.enquiries set status='lost' where id='5c999999-9999-4999-8999-999999999999';
insert into public.inspections (id,enquiry_id,inspection_type,preferred_date,time_zone)
values ('5cbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','5c555555-5555-4555-8555-555555555555',
  'Live video inspection',current_date + 2,'Africa/Lagos');

select results_eq($$select count(*) from public.lead_routing_settings$$,
  array[1::bigint], 'routing configuration has a single settings row');
select ok(not has_table_privilege('anon','public.lead_routing_settings','select,insert,update,delete'),
  'anonymous visitors cannot read or change routing settings');
select ok(not has_function_privilege('anon','public.set_default_lead_owner(uuid,boolean)','execute'),
  'anonymous visitors cannot select an operator');

set local role authenticated;
set local request.jwt.claim.sub='5c444444-4444-4444-8444-444444444444';
select throws_ok($$select public.get_default_lead_owner()$$,
  '42501','lead routing settings are restricted to administrators','viewer cannot read default owner');
select throws_ok($$select public.set_default_lead_owner(
  '5c222222-2222-4222-8222-222222222222',false)$$,
  '42501','lead routing settings are restricted to administrators','viewer cannot configure routing');

set local request.jwt.claim.sub='5c111111-1111-4111-8111-111111111111';
select results_eq($$select public.get_default_lead_owner()::text$$,
  array[null::text], 'multiple active operators require an explicit default');
select throws_ok($$select public.set_default_lead_owner(
  '5c444444-4444-4444-8444-444444444444',false)$$,
  '23514','default owner must be an active property operator','read-only viewer cannot be the default');
select throws_ok($$select public.set_default_lead_owner(null,true)$$,
  '23514','choose a default owner before assigning existing leads',
  'existing lead reassignment needs an explicit owner');

reset role;
update public.staff_profiles set active=false
where role in ('administrator','property_manager')
  and user_id <> '5c111111-1111-4111-8111-111111111111';
select results_eq($$select count(*)::integer from public.staff_profiles p
  join auth.users u on u.id=p.user_id
  where p.active and p.role in ('administrator','property_manager')
    and u.email_confirmed_at is not null and nullif(u.encrypted_password,'') is not null
    and (u.banned_until is null or u.banned_until <= now())$$,
  array[1], 'exactly one eligible property operator remains active');
set local role authenticated;
set local request.jwt.claim.sub='5c111111-1111-4111-8111-111111111111';
select results_eq($$select public.get_default_lead_owner()::text$$,
  array['5c111111-1111-4111-8111-111111111111'],
  'one eligible administrator is automatically the single operator');
reset role;
set local role service_role;
select lives_ok($$select public.ingest_enquiry(jsonb_build_object(
  'submissionKey','5ccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'interest','Booking an inspection','name','Sole Operator Intake','email','sole@example.com',
  'phone','+2348000000000','message','Single-operator routing fixture.',
  'inspectionPreference','Live video inspection',
  'inspectionDate',to_char(current_date + 2,'YYYY-MM-DD'),'timeZone','Africa/Lagos'))$$,
  'new public enquiry is ingested when exactly one property operator exists');
reset role;
select results_eq($$select p.display_name from public.enquiries e
  join public.staff_profiles p on p.user_id=e.assigned_to
  where e.submission_key='5ccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  array['Routing Admin'], 'sole operator receives incoming enquiries');
select results_eq($$select p.display_name from public.inspections i
  join public.enquiries e on e.id=i.enquiry_id
  join public.staff_profiles p on p.user_id=i.assigned_to
  where e.submission_key='5ccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  array['Routing Admin'], 'sole operator receives linked inspection requests');

update public.staff_profiles set active=true
where user_id in ('5c222222-2222-4222-8222-222222222222','5c333333-3333-4333-8333-333333333333',
  '5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
set local role authenticated;
set local request.jwt.claim.sub='5c111111-1111-4111-8111-111111111111';
select results_eq($$select public.set_default_lead_owner(
  '5c222222-2222-4222-8222-222222222222',true)::text$$,
  array['5c222222-2222-4222-8222-222222222222'],
  'administrator selects a default and routes existing open leads');
select results_eq($$select p.display_name from public.enquiries e
  join public.staff_profiles p on p.user_id=e.assigned_to
  where e.id='5c555555-5555-4555-8555-555555555555'$$,
  array['Operator One'], 'unassigned open lead is routed to the default');
select results_eq($$select p.display_name from public.enquiries e
  join public.staff_profiles p on p.user_id=e.assigned_to
  where e.id='5c777777-7777-4777-8777-777777777777'$$,
  array['Operator Two'], 'existing assignment is preserved');
select results_eq($$select p.display_name from public.inspections i
  join public.staff_profiles p on p.user_id=i.assigned_to
  where i.id='5cbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  array['Operator One'], 'linked inspection follows the default owner');
select results_eq($$select count(*) from public.enquiries
  where id='5c999999-9999-4999-8999-999999999999' and assigned_to is null$$,
  array[1::bigint], 'closed and unassigned leads are not bulk assigned');
select results_eq($$select public.set_default_lead_owner(
  '5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false)::text$$,
  array['5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'], 'administrator can hand default ownership to one operator');
select throws_ok($$select public.manage_staff_profile(
  '5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Operator Three','property_manager',false)$$,
  '23514','clear the default lead owner before disabling or changing their role',
  'default owner cannot be disabled before routing is handed off');
select lives_ok($$select public.set_default_lead_owner(null,false)$$,
  'administrator clears default routing before changing operator access');
select lives_ok($$select public.manage_staff_profile(
  '5caaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Operator Three','property_manager',false)$$,
  'operator can be disabled after routing handoff');

reset role;
select results_eq($$select count(*) from public.audit_events where entity_type='lead_routing'
  and action='default_owner_changed'$$,
  array[3::bigint], 'default owner selection and handoffs are audited');
select results_eq($$select count(*) from public.audit_events where entity_type='enquiry'
  and entity_id='5c555555-5555-4555-8555-555555555555' and action='assigned'$$,
  array[1::bigint], 'bulk lead assignments are individually audited');
select results_eq($$select count(*) from public.audit_events
  where entity_type='enquiry' and action='public_submission_created'
    and entity_id=(select id::text from public.enquiries
      where submission_key='5ccccccc-cccc-4ccc-8ccc-cccccccccccc')$$,
  array[1::bigint], 'public intake creates its normal submission audit event');
select results_eq($$select next_value ->> 'assignedTo' from public.audit_events
  where entity_id=(select id::text from public.enquiries
    where submission_key='5ccccccc-cccc-4ccc-8ccc-cccccccccccc')
    and action='public_submission_created'$$,
  array['5c111111-1111-4111-8111-111111111111'],
  'public submission audit records its automatic single-operator route');

select * from finish();
rollback;
