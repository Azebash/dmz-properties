begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email) values
  ('91111111-1111-4111-8111-111111111111', 'lead-admin@example.com'),
  ('92222222-2222-4222-8222-222222222222', 'lead-viewer@example.com'),
  ('93333333-3333-4333-8333-333333333333', 'lead-manager@example.com');
insert into public.staff_profiles (user_id, display_name, role) values
  ('91111111-1111-4111-8111-111111111111', 'Lead Admin', 'administrator'),
  ('92222222-2222-4222-8222-222222222222', 'Lead Viewer', 'viewer'),
  ('93333333-3333-4333-8333-333333333333', 'Lead Manager', 'property_manager');
insert into public.enquiries (
  id, submission_key, enquiry_type, name, email, phone, message, privacy_consent_at
) values (
  '94444444-4444-4444-8444-444444444444',
  '95555555-5555-4555-8555-555555555555',
  'Booking an inspection', 'Lead Fixture', 'buyer@example.com',
  '+2348000000000', 'A requested property inspection.', now()
);
insert into public.inspections (
  id, enquiry_id, inspection_type, preferred_date, time_zone
) values (
  '96666666-6666-4666-8666-666666666666',
  '94444444-4444-4444-8444-444444444444',
  'Live video inspection', current_date + 2, 'Africa/Lagos'
);

set local role anon;
select ok(
  not has_function_privilege('anon', 'public.update_enquiry_workflow(uuid,public.enquiry_status,text)', 'execute'),
  'anonymous visitors cannot call enquiry workflow'
);
select ok(
  not has_function_privilege('anon', 'public.update_inspection_workflow(uuid,public.inspection_status,text,text)', 'execute'),
  'anonymous visitors cannot call inspection workflow'
);
select throws_ok(
  $$select id from public.inspections where id = '96666666-6666-4666-8666-666666666666'$$,
  '42501', null,
  'anonymous visitors cannot read private inspections'
);

set local role authenticated;
set local request.jwt.claim.sub = '92222222-2222-4222-8222-222222222222';
select throws_ok(
  $$select public.update_enquiry_workflow('94444444-4444-4444-8444-444444444444', 'qualified', 'Viewer attempt')$$,
  '42501', 'enquiry management is not permitted',
  'viewer cannot change enquiry stage'
);
select throws_ok(
  $$select public.update_inspection_workflow('96666666-6666-4666-8666-666666666666', 'cancelled', null, null)$$,
  '42501', 'inspection management is not permitted',
  'viewer cannot change inspection state'
);
select throws_ok(
  $$select public.set_inspection_timezone('96666666-6666-4666-8666-666666666666', 'Africa/Lagos')$$,
  '42501', 'inspection management is not permitted',
  'viewer cannot correct an inspection time zone'
);

set local request.jwt.claim.sub = '93333333-3333-4333-8333-333333333333';
select throws_ok(
  $$select public.set_inspection_timezone('96666666-6666-4666-8666-666666666666', 'Not a time zone')$$,
  '23514', 'inspection time zone is not recognized',
  'manager cannot store an unrecognized time zone'
);
select results_eq(
  $$select public.set_inspection_timezone('96666666-6666-4666-8666-666666666666', 'Etc/UTC')$$,
  array['Etc/UTC'], 'manager corrects the inspection time zone'
);
select results_eq(
  $$select public.set_inspection_timezone('96666666-6666-4666-8666-666666666666', 'Africa/Lagos')$$,
  array['Africa/Lagos'], 'manager can restore the buyer time zone'
);
select results_eq(
  $$select public.update_enquiry_workflow('94444444-4444-4444-8444-444444444444', 'qualified', 'Buyer contacted')::text$$,
  array['qualified'], 'manager qualifies a new enquiry'
);
select throws_ok(
  $$select public.update_enquiry_workflow('94444444-4444-4444-8444-444444444444', 'won', 'Buyer contacted')$$,
  '23514', 'invalid enquiry status transition',
  'enquiry cannot jump from qualified directly to won'
);
select results_eq(
  $$select public.update_enquiry_workflow('94444444-4444-4444-8444-444444444444', 'qualified', 'Following up tomorrow')::text$$,
  array['qualified'], 'manager can update private notes without changing stage'
);
select results_eq(
  $$select name from public.enquiries where id = '94444444-4444-4444-8444-444444444444'$$,
  array['Lead Fixture'], 'active staff can read assigned enquiry details'
);
select results_eq(
  $$select public.update_inspection_workflow(
      '96666666-6666-4666-8666-666666666666', 'confirmed',
      to_char(now() at time zone 'Africa/Lagos' + interval '2 days', 'YYYY-MM-DD"T"HH24:MI'), null
    )::text$$,
  array['confirmed'], 'manager confirms the inspection in the buyer time zone'
);
select ok(
  (select scheduled_at > now() from public.inspections where id = '96666666-6666-4666-8666-666666666666'),
  'confirmed inspection stores a future UTC appointment'
);
select throws_ok(
  $$select public.update_inspection_workflow('96666666-6666-4666-8666-666666666666', 'completed', null, '')$$,
  '23514', 'completed inspections require a schedule and outcome notes',
  'completion without an outcome is rejected'
);
select results_eq(
  $$select public.update_inspection_workflow(
      '96666666-6666-4666-8666-666666666666', 'completed', null,
      'Buyer completed the remote inspection and requested documents.'
    )::text$$,
  array['completed'], 'manager records a completed inspection and outcome'
);
select throws_ok(
  $$select public.update_inspection_workflow('96666666-6666-4666-8666-666666666666', 'requested', null, null)$$,
  '23514', 'invalid inspection status transition',
  'completed inspection cannot be silently reopened'
);

reset role;
select results_eq(
  $$select count(*) from public.audit_events where entity_type = 'enquiry' and entity_id = '94444444-4444-4444-8444-444444444444' and action = 'workflow_updated'$$,
  array[2::bigint], 'both enquiry changes are audited'
);
select results_eq(
  $$select count(*) from public.audit_events where entity_type = 'inspection' and entity_id = '96666666-6666-4666-8666-666666666666' and action = 'workflow_updated'$$,
  array[2::bigint], 'inspection confirmation and completion are audited'
);

select * from finish();
rollback;
