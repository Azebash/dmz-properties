create table public.area_guides (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.publication_status not null default 'draft',
  draft_copy jsonb not null check (jsonb_typeof(draft_copy) = 'object'),
  published_copy jsonb check (published_copy is null or jsonb_typeof(published_copy) = 'object'),
  published_at timestamptz,
  updated_by uuid references public.staff_profiles(user_id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint area_guide_publication_complete check (
    status <> 'published' or (published_copy is not null and published_at is not null)
  )
);

alter table public.area_guides enable row level security;
revoke all on table public.area_guides from public, anon, authenticated;
grant select on public.area_guides to authenticated;
create policy "Staff reads area guide drafts"
on public.area_guides for select to authenticated using (private.is_staff());

create function public.get_published_area_guide(p_slug text)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select published_copy from public.area_guides
  where slug = p_slug and published_copy is not null
$$;

create function public.save_area_guide(p_slug text, p_copy jsonb)
returns public.publication_status
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  field_name text;
  old_copy jsonb;
  old_status public.publication_status;
  next_status public.publication_status;
begin
  if not private.has_staff_role(array['administrator', 'content_editor']::public.staff_role[]) then
    raise insufficient_privilege using message = 'area guide editing is not permitted';
  end if;
  if jsonb_typeof(p_copy) is distinct from 'object' then
    raise check_violation using message = 'area guide copy is invalid';
  end if;
  foreach field_name in array array[
    'heroTitle', 'heroDescription', 'galleryTitle', 'galleryDescription',
    'pathsTitle', 'infrastructureTitle', 'processTitle', 'seoTitle', 'seoDescription'
  ] loop
    if jsonb_typeof(p_copy -> field_name) is distinct from 'string'
      or char_length(trim(p_copy ->> field_name)) not between 10 and 400 then
      raise check_violation using message = 'area guide copy is incomplete';
    end if;
  end loop;

  select status, draft_copy into old_status, old_copy
  from public.area_guides where slug = p_slug for update;
  if not found then raise no_data_found using message = 'area guide not found'; end if;

  next_status := case when old_status = 'published' or old_status = 'under_review'
    then 'draft'::public.publication_status else old_status end;
  update public.area_guides set
    status = next_status, draft_copy = p_copy, updated_by = actor, updated_at = now()
  where slug = p_slug;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'area_guide', p_slug, 'updated',
    jsonb_build_object('status', old_status, 'copy', old_copy),
    jsonb_build_object('status', next_status, 'copy', p_copy)
  );
  return next_status;
end;
$$;

create function public.transition_area_guide_status(p_slug text, p_status public.publication_status)
returns public.publication_status
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  old_status public.publication_status;
begin
  if not private.has_staff_role(array['administrator', 'content_editor']::public.staff_role[]) then
    raise insufficient_privilege using message = 'area guide publication is not permitted';
  end if;
  select status into old_status from public.area_guides where slug = p_slug for update;
  if not found then raise no_data_found using message = 'area guide not found'; end if;
  if p_status is null or not (
    (old_status = 'draft' and p_status = 'under_review') or
    (old_status = 'under_review' and p_status in ('draft', 'published'))
  ) then
    raise check_violation using message = 'invalid area guide transition';
  end if;

  update public.area_guides set
    status = p_status,
    published_copy = case when p_status = 'published' then draft_copy else published_copy end,
    published_at = case when p_status = 'published' then now() else published_at end,
    updated_by = actor, updated_at = now()
  where slug = p_slug;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'area_guide', p_slug, 'status_changed',
    jsonb_build_object('status', old_status), jsonb_build_object('status', p_status)
  );
  return p_status;
end;
$$;

revoke all on function public.get_published_area_guide(text) from public;
grant execute on function public.get_published_area_guide(text) to anon, authenticated;
revoke all on function public.save_area_guide(text,jsonb) from public, anon;
grant execute on function public.save_area_guide(text,jsonb) to authenticated;
revoke all on function public.transition_area_guide_status(text,public.publication_status) from public, anon;
grant execute on function public.transition_area_guide_status(text,public.publication_status) to authenticated;

insert into public.area_guides (slug,status,draft_copy,published_copy,published_at,updated_at)
values (
  'kyc-homes-phase-ii', 'published',
  jsonb_build_object(
    'heroTitle', 'KYC Homes Phase II, understood from within.',
    'heroDescription', 'Explore land and properties in an established Abuja estate where hundreds have already developed and new development continues.',
    'galleryTitle', 'Established homes. Active development.',
    'galleryDescription', 'Genuine photography from KYC Homes Phase II showing completed residences alongside continuing construction across the estate.',
    'pathsTitle', 'Two ways to own within the estate.',
    'infrastructureTitle', 'Coordinated development standards.',
    'processTitle', 'Local knowledge without informal shortcuts.',
    'seoTitle', 'Land and Properties in KYC Homes Phase II, Abuja',
    'seoDescription', 'Explore developer land, developed homes, and verified owner resales in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja.'
  ),
  jsonb_build_object(
    'heroTitle', 'KYC Homes Phase II, understood from within.',
    'heroDescription', 'Explore land and properties in an established Abuja estate where hundreds have already developed and new development continues.',
    'galleryTitle', 'Established homes. Active development.',
    'galleryDescription', 'Genuine photography from KYC Homes Phase II showing completed residences alongside continuing construction across the estate.',
    'pathsTitle', 'Two ways to own within the estate.',
    'infrastructureTitle', 'Coordinated development standards.',
    'processTitle', 'Local knowledge without informal shortcuts.',
    'seoTitle', 'Land and Properties in KYC Homes Phase II, Abuja',
    'seoDescription', 'Explore developer land, developed homes, and verified owner resales in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja.'
  ),
  '2026-09-17T00:00:00Z'::timestamptz,
  '2026-09-17T00:00:00Z'::timestamptz
)
on conflict (slug) do nothing;
