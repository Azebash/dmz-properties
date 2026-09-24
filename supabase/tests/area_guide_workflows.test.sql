begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id,email) values
  ('83333333-3333-4333-8333-333333333333','guide-viewer@example.com'),
  ('84444444-4444-4444-8444-444444444444','guide-editor@example.com');
update auth.users set email_confirmed_at = now(), encrypted_password = 'fixture-hash'
where id in ('83333333-3333-4333-8333-333333333333', '84444444-4444-4444-8444-444444444444');
insert into public.staff_profiles (user_id,display_name,role) values
  ('83333333-3333-4333-8333-333333333333','Guide Viewer','viewer'),
  ('84444444-4444-4444-8444-444444444444','Guide Editor','content_editor');

set local role anon;
select results_eq(
  $$select public.get_published_area_guide('kyc-homes-phase-ii')->>'heroTitle'$$,
  array['KYC Homes Phase II, understood from within.'],
  'anonymous visitor reads only the seeded published copy'
);
select ok(not has_table_privilege('anon','public.area_guides','select'),
  'anonymous visitor cannot read private drafts or publication state');
select ok(not has_function_privilege('anon','public.save_area_guide(text,jsonb)','execute'),
  'anonymous visitor cannot edit area copy');
select ok(not has_function_privilege('anon','public.transition_area_guide_status(text,public.publication_status)','execute'),
  'anonymous visitor cannot publish area copy');

set local role authenticated;
set local request.jwt.claim.sub = '83333333-3333-4333-8333-333333333333';
select throws_ok(
  $$select public.save_area_guide('kyc-homes-phase-ii','{}'::jsonb)$$,
  '42501','area guide editing is not permitted',
  'read-only staff cannot edit an area guide'
);
set local request.jwt.claim.sub = '84444444-4444-4444-8444-444444444444';
select throws_ok(
  $$select public.save_area_guide('kyc-homes-phase-ii','{}'::jsonb)$$,
  '23514','area guide copy is incomplete',
  'incomplete copy cannot be saved'
);
select throws_ok(
  $$update public.area_guides set published_copy='{}'::jsonb where slug='kyc-homes-phase-ii'$$,
  '42501',null,
  'editor cannot bypass audited publishing with a table update'
);
select results_eq(
  $$select public.save_area_guide('kyc-homes-phase-ii',
    jsonb_set((select draft_copy from public.area_guides where slug='kyc-homes-phase-ii'),
      '{heroTitle}','"Revised guide headline for review"'::jsonb))::text$$,
  array['draft'],
  'editing a published page creates a private draft'
);
select results_eq(
  $$select public.get_published_area_guide('kyc-homes-phase-ii')->>'heroTitle'$$,
  array['KYC Homes Phase II, understood from within.'],
  'the live guide keeps its approved copy during drafting'
);
select throws_ok(
  $$select public.transition_area_guide_status('kyc-homes-phase-ii','published')$$,
  '23514','invalid area guide transition',
  'drafts cannot skip review'
);
select results_eq(
  $$select public.transition_area_guide_status('kyc-homes-phase-ii','under_review')::text$$,
  array['under_review'],
  'editor submits area copy for review'
);
select results_eq(
  $$select public.transition_area_guide_status('kyc-homes-phase-ii','published')::text$$,
  array['published'],
  'editor publishes reviewed copy'
);
set local role anon;
select results_eq(
  $$select public.get_published_area_guide('kyc-homes-phase-ii')->>'heroTitle'$$,
  array['Revised guide headline for review'],
  'anonymous visitors now read the newly approved copy'
);
reset role;
select results_eq(
  $$select count(*) from public.audit_events where entity_type='area_guide' and entity_id='kyc-homes-phase-ii'$$,
  array[3::bigint],
  'draft, review, and publication are audited'
);
select results_eq(
  $$select count(*) from public.audit_events where entity_type='area_guide' and entity_id='kyc-homes-phase-ii' and actor_id='84444444-4444-4444-8444-444444444444'$$,
  array[3::bigint],
  'editor identity accompanies each change'
);

select * from finish();
rollback;
