begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, email) values
  ('81111111-1111-4111-8111-111111111111', 'editor-viewer@example.com'),
  ('82222222-2222-4222-8222-222222222222', 'editor@example.com');
insert into public.staff_profiles (user_id, display_name, role) values
  ('81111111-1111-4111-8111-111111111111', 'Editorial Viewer', 'viewer'),
  ('82222222-2222-4222-8222-222222222222', 'Editorial Editor', 'content_editor');
insert into public.articles (slug, title, category, status, excerpt, body, published_at)
values
  ('rls-editor-published', 'Published editorial fixture', 'Area guide', 'published',
   'A public fixture for verifying article visibility and editorial access.',
   '[{"heading":"Published section","body":"A fully formed public section for testing editorial publication visibility."}]'::jsonb, now()),
  ('rls-editor-draft', 'Draft editorial fixture', 'Area guide', 'draft',
   'A private fixture for verifying article visibility and editorial access.',
   '[{"heading":"Draft section","body":"A fully formed private section for testing draft publication visibility."}]'::jsonb, null);

set local role anon;
select results_eq(
  $$select slug from public.articles where slug in ('rls-editor-published','rls-editor-draft') order by slug$$,
  array['rls-editor-published'],
  'anonymous readers see published articles but not drafts'
);
select ok(
  not has_function_privilege('anon', 'public.save_article(jsonb)', 'execute'),
  'anonymous callers cannot create articles'
);
select ok(
  not has_function_privilege('anon', 'public.transition_article_status(uuid,public.publication_status)', 'execute'),
  'anonymous callers cannot publish articles'
);

set local role authenticated;
set local request.jwt.claim.sub = '81111111-1111-4111-8111-111111111111';
select throws_ok(
  $$select public.save_article('{"slug":"rls-editor-new","title":"A new editorial fixture","category":"Guide","excerpt":"A valid private editorial article excerpt for review.","sections":[{"heading":"First section","body":"This is a complete paragraph to test role-protected editorial creation."}],"readTimeMinutes":2}'::jsonb)$$,
  '42501', 'article editing is not permitted',
  'viewer cannot edit articles'
);
select throws_ok(
  $$select public.transition_article_status((select id from public.articles where slug='rls-editor-draft'), 'published')$$,
  '42501', 'article publication is not permitted',
  'viewer cannot publish articles'
);

set local request.jwt.claim.sub = '82222222-2222-4222-8222-222222222222';
select throws_ok(
  $$select public.save_article('{"slug":"rls-invalid-body","title":"An invalid editorial fixture","category":"Guide","excerpt":"A valid excerpt with an incomplete article section for testing.","sections":[{"heading":"Section","body":"Short"}],"readTimeMinutes":2}'::jsonb)$$,
  '23514', 'article sections are incomplete',
  'an editor cannot create an incomplete article section'
);
select lives_ok(
  $$select public.save_article('{"slug":"rls-editor-new","title":"A new editorial fixture","category":"Guide","excerpt":"A valid private editorial article excerpt for review.","sections":[{"heading":"First section","body":"This is a complete paragraph to test role-protected editorial creation."}],"readTimeMinutes":2}'::jsonb)$$,
  'content editor creates a draft via audited RPC'
);
select results_eq(
  $$select status::text from public.articles where slug='rls-editor-new'$$,
  array['draft'],
  'new article is draft by default'
);
select throws_ok(
  $$update public.articles set status='published' where slug='rls-editor-new'$$,
  '42501', null,
  'editor cannot bypass the publication RPC with direct table writes'
);
select throws_ok(
  $$select public.transition_article_status((select id from public.articles where slug='rls-editor-new'), 'published')$$,
  '23514', 'invalid article status transition',
  'article cannot skip editorial review'
);
select results_eq(
  $$select public.transition_article_status((select id from public.articles where slug='rls-editor-new'), 'under_review')::text$$,
  array['under_review'],
  'content editor moves draft into review'
);
select results_eq(
  $$select public.transition_article_status((select id from public.articles where slug='rls-editor-new'), 'published')::text$$,
  array['published'],
  'reviewed article becomes published'
);

set local role anon;
select results_eq(
  $$select slug from public.articles where slug='rls-editor-new'$$,
  array['rls-editor-new'],
  'published article becomes visible to anonymous readers'
);
set local role authenticated;
set local request.jwt.claim.sub = '82222222-2222-4222-8222-222222222222';
select throws_ok(
  $$select public.save_article(jsonb_set('{"slug":"rls-editor-renamed","title":"A new editorial fixture","category":"Guide","excerpt":"A valid private editorial article excerpt for review.","sections":[{"heading":"First section","body":"This is a complete paragraph to test role-protected editorial creation."}],"readTimeMinutes":2}'::jsonb,'{id}',to_jsonb((select id::text from public.articles where slug='rls-editor-new'))))$$,
  '23514', 'published article slugs cannot change',
  'published article URL remains stable'
);
select lives_ok(
  $$select public.save_article(jsonb_set('{"slug":"rls-editor-new","title":"An updated editorial fixture","category":"Guide","excerpt":"A valid private editorial article excerpt after review and update.","sections":[{"heading":"First section","body":"This is a revised paragraph to test audited edits to a published article."}],"readTimeMinutes":2}'::jsonb,'{id}',to_jsonb((select id::text from public.articles where slug='rls-editor-new'))))$$,
  'content editor can update a published article without changing its URL'
);
select results_eq(
  $$select title from public.articles where slug='rls-editor-new'$$,
  array['An updated editorial fixture'],
  'published article update is persisted'
);

reset role;
select results_eq(
  $$select count(*) from public.audit_events where entity_type='article' and action='created' and entity_id=(select id::text from public.articles where slug='rls-editor-new')$$,
  array[1::bigint],
  'article creation is audited'
);
select results_eq(
  $$select count(*) from public.audit_events where entity_type='article' and action='status_changed' and entity_id=(select id::text from public.articles where slug='rls-editor-new')$$,
  array[2::bigint],
  'review and publication transitions are audited'
);
select results_eq(
  $$select count(*) from public.audit_events where entity_type='article' and action='updated' and entity_id=(select id::text from public.articles where slug='rls-editor-new')$$,
  array[1::bigint],
  'published article update is audited'
);

select * from finish();
rollback;
