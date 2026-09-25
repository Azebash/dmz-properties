begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id,email,email_confirmed_at,encrypted_password) values
  ('6b111111-1111-4111-8111-111111111111','reminder-manager@example.com',now(),'fixture-hash'),
  ('6b222222-2222-4222-8222-222222222222','reminder-viewer@example.com',now(),'fixture-hash');
insert into public.staff_profiles (user_id,display_name,role) values
  ('6b111111-1111-4111-8111-111111111111','Reminder Manager','property_manager'),
  ('6b222222-2222-4222-8222-222222222222','Reminder Viewer','viewer');
insert into public.enquiries (id,submission_key,enquiry_type,name,email,phone,message,privacy_consent_at)
values ('6b333333-3333-4333-8333-333333333333',
  '6b444444-4444-4444-8444-444444444444','Buying a plot','Follow-up Fixture',
  'reminder-buyer@example.com','+2348000000000','Temporary lead reminder fixture.',now());

set local role anon;
select ok(not has_function_privilege('anon','public.set_enquiry_follow_up(uuid,date)','execute'),
  'anonymous visitors cannot schedule a private lead reminder');
set local role authenticated;
set local request.jwt.claim.sub = '6b222222-2222-4222-8222-222222222222';
select throws_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',current_date + 1)$$,
  '42501','enquiry management is not permitted','viewer cannot schedule reminders');
set local request.jwt.claim.sub = '6b111111-1111-4111-8111-111111111111';
select ok(not has_table_privilege('authenticated','public.enquiries','update'),
  'staff cannot change reminder dates outside the audited RPC');
select throws_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',(now() at time zone 'Africa/Lagos')::date - 1)$$,
  '23514','follow-up date must be within the next year','past dates are rejected');
select throws_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',(now() at time zone 'Africa/Lagos')::date + 367)$$,
  '23514','follow-up date must be within the next year','far-future dates are rejected');
select results_eq($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',(now() at time zone 'Africa/Lagos')::date + 1)::text$$,
  array[((now() at time zone 'Africa/Lagos')::date + 1)::text], 'manager schedules a date in Abuja time');
select lives_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',(now() at time zone 'Africa/Lagos')::date + 1)$$,
  'repeating the same date is safe');
reset role;
select results_eq($$select count(*) from public.audit_events where entity_type='enquiry'
  and entity_id='6b333333-3333-4333-8333-333333333333' and action='follow_up_changed'$$,
  array[1::bigint], 'idempotent retries do not create duplicate audit events');
set local role authenticated;
set local request.jwt.claim.sub = '6b111111-1111-4111-8111-111111111111';
select lives_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',null)$$,
  'manager clears a reminder');
select results_eq($$select count(*) from public.enquiries
  where id='6b333333-3333-4333-8333-333333333333' and follow_up_on is null$$,
  array[1::bigint], 'clearing removes the due date');
select lives_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',(now() at time zone 'Africa/Lagos')::date)$$,
  'a lead can be due today');
select results_eq($$select public.update_enquiry_workflow(
  '6b333333-3333-4333-8333-333333333333','lost','Buyer no longer interested')::text$$,
  array['lost'], 'closing an enquiry retains the existing lead workflow');
select results_eq($$select count(*) from public.enquiries
  where id='6b333333-3333-4333-8333-333333333333' and follow_up_on is null$$,
  array[1::bigint], 'terminal status automatically clears reminders');
reset role;
select results_eq($$select previous_value ->> 'followUpOn' from public.audit_events
  where entity_id='6b333333-3333-4333-8333-333333333333' and action='workflow_updated'$$,
  array[((now() at time zone 'Africa/Lagos')::date)::text],
  'terminal transition audit retains the cleared reminder date');
set local role authenticated;
set local request.jwt.claim.sub = '6b111111-1111-4111-8111-111111111111';
select throws_ok($$select public.set_enquiry_follow_up(
  '6b333333-3333-4333-8333-333333333333',(now() at time zone 'Africa/Lagos')::date + 1)$$,
  '23514','closed enquiries cannot have a follow-up','closed leads reject new reminders');
select results_eq($$select public.update_enquiry_workflow(
  '6b333333-3333-4333-8333-333333333333','qualified','Buyer interest reconfirmed')::text$$,
  array['qualified'], 'closed leads may reopen through existing allowed transition');
select results_eq($$select count(*) from public.enquiries
  where id='6b333333-3333-4333-8333-333333333333' and follow_up_on is null$$,
  array[1::bigint], 'reopening does not revive an old reminder');

select * from finish();
rollback;
