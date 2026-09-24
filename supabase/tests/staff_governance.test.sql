begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

insert into auth.users (id, email) values
  ('85555555-5555-4555-8555-555555555555', 'staff-admin@example.com'),
  ('86666666-6666-4666-8666-666666666666', 'staff-manager@example.com'),
  ('87777777-7777-4777-8777-777777777777', 'staff-viewer@example.com'),
  ('88888888-8888-4888-8888-888888888888', 'staff-second-admin@example.com'),
  ('8ccccccc-cccc-4ccc-8ccc-cccccccccccc', 'staff-editor@example.com'),
  ('8ddddddd-dddd-4ddd-8ddd-dddddddddddd', 'staff-unconfirmed@example.com'),
  ('8eeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'staff-passwordless@example.com'),
  ('8fffffff-ffff-4fff-8fff-ffffffffffff', 'staff-old-unconfirmed@example.com'),
  ('8abababa-abab-4aba-8aba-abababababab', 'staff-banned@example.com');
update auth.users set email_confirmed_at = now(), encrypted_password = 'fixture-hash'
where id in ('85555555-5555-4555-8555-555555555555',
  '86666666-6666-4666-8666-666666666666',
  '87777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
  '8ccccccc-cccc-4ccc-8ccc-cccccccccccc');
update auth.users set email_confirmed_at = now()
where id = '8eeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
update auth.users set encrypted_password = 'fixture-hash'
where id = '8fffffff-ffff-4fff-8fff-ffffffffffff';
update auth.users set email_confirmed_at = now(), encrypted_password = 'fixture-hash',
  banned_until = now() + interval '1 day'
where id = '8abababa-abab-4aba-8aba-abababababab';
insert into public.staff_profiles (user_id, display_name, role) values
  ('85555555-5555-4555-8555-555555555555', 'First Administrator', 'administrator'),
  ('86666666-6666-4666-8666-666666666666', 'Property Manager', 'property_manager'),
  ('87777777-7777-4777-8777-777777777777', 'Read-only Viewer', 'viewer'),
  ('8ccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Content Editor', 'content_editor'),
  ('8fffffff-ffff-4fff-8fff-ffffffffffff', 'Legacy Invalid Viewer', 'viewer'),
  ('8abababa-abab-4aba-8aba-abababababab', 'Banned Manager', 'property_manager');
insert into public.enquiries (
  id, submission_key, enquiry_type, name, email, phone,
  message, privacy_consent_at
) values (
  '89999999-9999-4999-8999-999999999999',
  '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Booking an inspection', 'Staff Assignment Fixture',
  'fixture@example.com', '+2348000000000', 'An inspection assignment fixture.', now()
);
insert into public.inspections (id, enquiry_id, inspection_type, preferred_date, time_zone)
values (
  '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '89999999-9999-4999-8999-999999999999',
  'Live video inspection', current_date + 3, 'Africa/Lagos'
);
insert into public.seller_submissions (
  enquiry_id, owner_name, owner_phone, property_description
) values (
  '89999999-9999-4999-8999-999999999999',
  'Seller Fixture', '+2348000000000', 'A private seller fixture for access checks.'
);

set local role anon;
select ok(not has_function_privilege('anon', 'public.staff_directory()', 'execute'),
  'anonymous visitors cannot list staff');
select ok(not has_function_privilege('anon',
  'public.manage_staff_profile(uuid,text,public.staff_role,boolean)', 'execute'),
  'anonymous visitors cannot manage staff');
select ok(not has_function_privilege('anon', 'public.assign_enquiry_staff(uuid,uuid)', 'execute'),
  'anonymous visitors cannot assign leads');

set local role authenticated;
set local request.jwt.claim.sub = '87777777-7777-4777-8777-777777777777';
select results_eq($$select count(*) from public.enquiries
  where id='89999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'viewer cannot read buyer contact details');
select results_eq($$select count(*) from public.inspections
  where enquiry_id='89999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'viewer cannot read private inspection details');
select results_eq($$select count(*) from public.seller_submissions
  where enquiry_id='89999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'viewer cannot read owner submissions');
select throws_ok($$select * from public.staff_directory()$$,
  '42501', 'staff directory is restricted to administrators',
  'read-only viewers cannot enumerate staff emails');
select throws_ok($$select public.manage_staff_profile(
  '86666666-6666-4666-8666-666666666666','Forged Manager','administrator',true)$$,
  '42501', 'staff management is restricted to administrators',
  'viewers cannot grant administrator access');
select throws_ok($$select public.assign_enquiry_staff(
  '89999999-9999-4999-8999-999999999999',
  '87777777-7777-4777-8777-777777777777')$$,
  '42501', 'lead assignment is restricted to administrators',
  'viewers cannot assign leads');

set local request.jwt.claim.sub = '86666666-6666-4666-8666-666666666666';
select results_eq($$select count(*) from public.enquiries
  where id='89999999-9999-4999-8999-999999999999'$$,
  array[1::bigint], 'property manager can read lead details');
select throws_ok($$select public.manage_staff_profile(
  '86666666-6666-4666-8666-666666666666','Forged Manager','administrator',true)$$,
  '42501', 'staff management is restricted to administrators',
  'property managers cannot elevate themselves');

set local request.jwt.claim.sub = '85555555-5555-4555-8555-555555555555';
select throws_ok($$select public.manage_staff_profile(
  '8ddddddd-dddd-4ddd-8ddd-dddddddddddd','Unconfirmed Account','viewer',true)$$,
  '23514', 'staff requires confirmed and unbanned Auth credentials',
  'unconfirmed Auth user cannot be granted active staff access');
select throws_ok($$select public.manage_staff_profile(
  '8eeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','No Password','viewer',true)$$,
  '23514', 'staff requires confirmed and unbanned Auth credentials',
  'confirmed invitation without a password cannot be granted staff access');
select throws_ok($$select public.manage_staff_profile(
  '8fffffff-ffff-4fff-8fff-ffffffffffff','Legacy Invalid Viewer','property_manager',true)$$,
  '23514', 'staff requires confirmed and unbanned Auth credentials',
  'active legacy unconfirmed accounts cannot be promoted');
select throws_ok($$select public.manage_staff_profile(
  '8abababa-abab-4aba-8aba-abababababab','Banned Manager','administrator',true)$$,
  '23514', 'staff requires confirmed and unbanned Auth credentials',
  'banned staff cannot receive an active administrator role');
select results_eq($$select count(*) from public.seller_submissions
  where enquiry_id='89999999-9999-4999-8999-999999999999'$$,
  array[1::bigint], 'administrator can read private owner submissions');
select results_eq($$select email from public.staff_directory()
  where user_id='86666666-6666-4666-8666-666666666666'$$,
  array['staff-manager@example.com'],
  'administrators can see staff identities');
select results_eq($$select auth_eligible from public.staff_directory()
  where user_id='8abababa-abab-4aba-8aba-abababababab'$$,
  array[false], 'administrators can see that a banned member cannot work');
select throws_ok($$select public.assign_enquiry_staff(
  '89999999-9999-4999-8999-999999999999',
  '8abababa-abab-4aba-8aba-abababababab')$$,
  '23514', 'assignee must be an active property staff member',
  'banned managers cannot receive buyer enquiries');
select throws_ok($$select public.manage_staff_profile(
  '85555555-5555-4555-8555-555555555555','First Administrator','viewer',false)$$,
  '23514', 'administrators cannot remove their own access',
  'administrator cannot lock out their own session');
select lives_ok($$select public.manage_staff_profile(
  '88888888-8888-4888-8888-888888888888','Second Administrator','administrator',true)$$,
  'an administrator can onboard an existing Auth user');
select throws_ok($$update public.staff_profiles set role='administrator'
  where user_id='86666666-6666-4666-8666-666666666666'$$,
  '42501', null, 'direct profile writes cannot bypass the audited RPC');
select throws_ok($$select public.assign_enquiry_staff(
  '89999999-9999-4999-8999-999999999999',
  '87777777-7777-4777-8777-777777777777')$$,
  '23514', 'assignee must be an active property staff member',
  'viewer cannot own enquiries');
select lives_ok($$select public.assign_enquiry_staff(
  '89999999-9999-4999-8999-999999999999',
  '86666666-6666-4666-8666-666666666666')$$,
  'administrator assigns an enquiry to active property staff');
select results_eq($$select assigned_to from public.inspections
  where enquiry_id='89999999-9999-4999-8999-999999999999'$$,
  array['86666666-6666-4666-8666-666666666666'::uuid],
  'inspection ownership follows its enquiry');
select throws_ok($$select public.manage_staff_profile(
  '86666666-6666-4666-8666-666666666666','Property Manager','viewer',false)$$,
  '23514', 'reassign staff work before changing access',
  'staff with assigned work cannot be disabled before handoff');
select lives_ok($$select public.assign_enquiry_staff(
  '89999999-9999-4999-8999-999999999999',
  '88888888-8888-4888-8888-888888888888')$$,
  'administrator can hand off work to another administrator');
select lives_ok($$select public.manage_staff_profile(
  '86666666-6666-4666-8666-666666666666','Property Manager','viewer',false)$$,
  'manager can be disabled after a complete handoff');
select results_eq($$select count(*) from public.audit_events
  where entity_type='staff_profile'
    and entity_id='86666666-6666-4666-8666-666666666666'$$,
  array[1::bigint], 'role changes are audited');
select results_eq($$select count(*) from public.audit_events
  where action='assigned' and entity_id in (
    '89999999-9999-4999-8999-999999999999',
    '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')$$,
  array[4::bigint], 'enquiry and inspection assignments are audited together');
select results_eq($$select count(*) from public.staff_profiles
  where user_id='88888888-8888-4888-8888-888888888888' and active$$,
  array[1::bigint], 'new administrator remains active after staff changes');

set local role authenticated;
set local request.jwt.claim.sub = '8fffffff-ffff-4fff-8fff-ffffffffffff';
select results_eq($$select private.is_staff()$$, array[false],
  'legacy active but unconfirmed account has no effective staff role');
select results_eq($$select count(*) from public.staff_profiles
  where user_id='8fffffff-ffff-4fff-8fff-ffffffffffff'$$,
  array[0::bigint], 'unconfirmed account cannot read its own active profile');
set local request.jwt.claim.sub = '8abababa-abab-4aba-8aba-abababababab';
select results_eq($$select private.is_staff()$$, array[false],
  'banned Auth account immediately loses its effective staff role');
select results_eq($$select count(*) from public.staff_profiles
  where user_id='8abababa-abab-4aba-8aba-abababababab'$$,
  array[0::bigint], 'banned account cannot read its own active profile');
set local request.jwt.claim.sub = '8ccccccc-cccc-4ccc-8ccc-cccccccccccc';
select results_eq($$select count(*) from public.enquiries
  where id='89999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'content editors cannot read buyer contact details');

reset role;
select throws_ok(
  $$delete from auth.users where id='85555555-5555-4555-8555-555555555555'$$,
  '23503', null, 'Auth deletion cannot silently remove the active administrator profile'
);

select * from finish();
rollback;
