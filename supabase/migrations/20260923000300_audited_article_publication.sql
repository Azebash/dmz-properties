create function public.save_article(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  article_id uuid;
  previous_row jsonb;
  next_row jsonb;
  sections jsonb := p_payload -> 'sections';
  reading_minutes integer;
begin
  if not private.has_staff_role(
    array['administrator', 'content_editor']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'article editing is not permitted';
  end if;

  if coalesce(p_payload ->> 'slug', '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or char_length(p_payload ->> 'slug') > 120
    or char_length(trim(coalesce(p_payload ->> 'title', ''))) not between 5 and 160
    or char_length(trim(coalesce(p_payload ->> 'category', ''))) not between 2 and 100
    or char_length(trim(coalesce(p_payload ->> 'excerpt', ''))) not between 20 and 500
  then
    raise check_violation using message = 'article fields are invalid';
  end if;

  if jsonb_typeof(sections) is distinct from 'array'
    or jsonb_array_length(sections) not between 1 and 12
  then
    raise check_violation using message = 'an article needs 1 to 12 sections';
  end if;

  if exists (
    select 1 from jsonb_array_elements(sections) as entry(value)
    where jsonb_typeof(entry.value) is distinct from 'object'
      or char_length(trim(coalesce(entry.value ->> 'heading', ''))) not between 3 and 140
      or char_length(trim(coalesce(entry.value ->> 'body', ''))) not between 30 and 6000
  ) then
    raise check_violation using message = 'article sections are incomplete';
  end if;

  begin
    reading_minutes := (p_payload ->> 'readTimeMinutes')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise check_violation using message = 'reading time is invalid';
  end;
  if reading_minutes is null or reading_minutes not between 1 and 30 then
    raise check_violation using message = 'reading time is invalid';
  end if;

  article_id := nullif(p_payload ->> 'id', '')::uuid;
  if article_id is null then
    insert into public.articles (
      slug, title, category, status, excerpt, body, read_time_minutes,
      seo_title, seo_description, author_id
    ) values (
      p_payload ->> 'slug', trim(p_payload ->> 'title'),
      trim(p_payload ->> 'category'), 'draft', trim(p_payload ->> 'excerpt'),
      sections, reading_minutes, nullif(trim(p_payload ->> 'seoTitle'), ''),
      nullif(trim(p_payload ->> 'seoDescription'), ''), actor
    ) returning id, to_jsonb(articles.*) into article_id, next_row;

    insert into public.audit_events (
      actor_id, entity_type, entity_id, action, next_value
    ) values (actor, 'article', article_id::text, 'created', next_row);
  else
    select to_jsonb(a.*) into previous_row
    from public.articles a where a.id = article_id for update;
    if previous_row is null then
      raise no_data_found using message = 'article not found';
    end if;
    if previous_row ->> 'published_at' is not null
      and previous_row ->> 'slug' <> p_payload ->> 'slug'
    then
      raise check_violation using message = 'published article slugs cannot change';
    end if;

    update public.articles set
      slug = p_payload ->> 'slug',
      title = trim(p_payload ->> 'title'),
      category = trim(p_payload ->> 'category'),
      excerpt = trim(p_payload ->> 'excerpt'),
      body = sections,
      read_time_minutes = reading_minutes,
      seo_title = nullif(trim(p_payload ->> 'seoTitle'), ''),
      seo_description = nullif(trim(p_payload ->> 'seoDescription'), '')
    where id = article_id
    returning to_jsonb(articles.*) into next_row;

    insert into public.audit_events (
      actor_id, entity_type, entity_id, action, previous_value, next_value
    ) values (actor, 'article', article_id::text, 'updated', previous_row, next_row);
  end if;

  return article_id;
end;
$$;

create function public.transition_article_status(
  p_article_id uuid,
  p_status public.publication_status
)
returns public.publication_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  old_status public.publication_status;
  article_body jsonb;
begin
  if not private.has_staff_role(
    array['administrator', 'content_editor']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'article publication is not permitted';
  end if;

  select status, body into old_status, article_body
  from public.articles where id = p_article_id for update;
  if not found then raise no_data_found using message = 'article not found'; end if;

  if p_status is null or not (
    (old_status = 'draft' and p_status in ('under_review', 'archived'))
    or (old_status = 'under_review' and p_status in ('draft', 'published', 'archived'))
    or (old_status = 'published' and p_status in ('under_review', 'archived'))
    or (old_status = 'archived' and p_status = 'draft')
  ) then
    raise check_violation using message = 'invalid article status transition';
  end if;

  if p_status = 'published' and jsonb_array_length(article_body) = 0 then
    raise check_violation using message = 'an article needs content before publication';
  end if;

  update public.articles set
    status = p_status,
    published_at = case when p_status = 'published'
      then coalesce(published_at, now()) else published_at end
  where id = p_article_id;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'article', p_article_id::text, 'status_changed',
    jsonb_build_object('status', old_status),
    jsonb_build_object('status', p_status)
  );

  return p_status;
end;
$$;

revoke all on function public.save_article(jsonb) from public, anon;
grant execute on function public.save_article(jsonb) to authenticated;
revoke all on function public.transition_article_status(uuid, public.publication_status)
from public, anon;
grant execute on function public.transition_article_status(uuid, public.publication_status)
to authenticated;
