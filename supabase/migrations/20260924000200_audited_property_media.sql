alter table public.property_media
add column verification_status public.verification_status not null default 'submitted';

create index property_media_public_idx on public.property_media
(property_id, verification_status, sort_order);

drop policy "Public reads media for published properties" on public.property_media;
create policy "Public reads approved media for published properties"
on public.property_media for select to anon, authenticated
using (
  verification_status = 'approved'
  and exists (
    select 1 from public.properties p
    where p.id = property_id and p.status = 'published'
  )
);

drop policy "Staff reads all property media" on public.property_media;
create policy "Property staff reads all media"
on public.property_media for select to authenticated
using (private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]));

drop policy "Staff reads property media objects" on storage.objects;
create policy "Property staff reads property media objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'property-media'
  and private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[])
);

create function public.add_property_media(
  p_property_id uuid, p_storage_path text, p_alt_text text,
  p_caption text, p_estate_context boolean
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  property_type text;
  media_id uuid;
  next_order integer;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property media editing is not permitted';
  end if;
  select p.property_type into property_type from public.properties p
  where p.id = p_property_id for update;
  if not found then raise no_data_found using message = 'property not found'; end if;
  if p_storage_path !~ ('^' || p_property_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$')
    or char_length(trim(coalesce(p_alt_text, ''))) not between 12 and 220
    or char_length(coalesce(p_caption, '')) > 300
    or p_estate_context is null then
    raise check_violation using message = 'media fields are invalid';
  end if;
  if property_type = 'Land' and not p_estate_context then
    raise check_violation using message = 'land photographs must be estate context';
  end if;

  select coalesce(max(sort_order) + 1, 0) into next_order from public.property_media
  where property_id = p_property_id;
  insert into public.property_media (
    property_id, storage_path, media_type, alt_text, caption,
    estate_context, sort_order, verification_status, created_by
  ) values (
    p_property_id, p_storage_path, 'image', trim(p_alt_text),
    nullif(trim(p_caption), ''), p_estate_context, next_order, 'submitted', actor
  ) returning id into media_id;
  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, next_value
  ) values (
    actor, 'property_media', media_id::text, 'created',
    jsonb_build_object('propertyId', p_property_id, 'estateContext', p_estate_context,
      'altText', trim(p_alt_text), 'status', 'submitted')
  );
  return media_id;
end;
$$;

create function public.update_property_media(
  p_media_id uuid, p_alt_text text, p_caption text,
  p_estate_context boolean, p_sort_order integer
)
returns public.verification_status
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.property_media%rowtype;
  next_row public.property_media%rowtype;
  is_land boolean;
  content_changed boolean;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property media editing is not permitted';
  end if;
  select * into previous_row from public.property_media
  where id = p_media_id for update;
  if not found then raise no_data_found using message = 'property media not found'; end if;
  select property_type = 'Land' into is_land from public.properties
  where id = previous_row.property_id;
  if char_length(trim(coalesce(p_alt_text, ''))) not between 12 and 220
    or char_length(coalesce(p_caption, '')) > 300
    or p_estate_context is null or p_sort_order not between 0 and 10000 then
    raise check_violation using message = 'media fields are invalid';
  end if;
  if is_land and not p_estate_context then
    raise check_violation using message = 'land photographs must be estate context';
  end if;
  content_changed := previous_row.alt_text is distinct from trim(p_alt_text)
    or previous_row.caption is distinct from nullif(trim(p_caption), '')
    or previous_row.estate_context is distinct from p_estate_context;
  if not content_changed and previous_row.sort_order = p_sort_order then
    return previous_row.verification_status;
  end if;

  update public.property_media set
    alt_text = trim(p_alt_text), caption = nullif(trim(p_caption), ''),
    estate_context = p_estate_context, sort_order = p_sort_order,
    verification_status = case when content_changed and verification_status in ('approved', 'rejected')
      then 'submitted'::public.verification_status else verification_status end
  where id = p_media_id returning * into next_row;
  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'property_media', p_media_id::text, 'updated',
    jsonb_build_object('altText', previous_row.alt_text, 'caption', previous_row.caption,
      'estateContext', previous_row.estate_context, 'sortOrder', previous_row.sort_order,
      'status', previous_row.verification_status),
    jsonb_build_object('altText', next_row.alt_text, 'caption', next_row.caption,
      'estateContext', next_row.estate_context, 'sortOrder', next_row.sort_order,
      'status', next_row.verification_status)
  );
  return next_row.verification_status;
end;
$$;

create function public.transition_property_media(
  p_media_id uuid, p_status public.verification_status, p_rights_confirmed boolean
)
returns public.verification_status
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_status public.verification_status;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property media approval is not permitted';
  end if;
  select verification_status into previous_status from public.property_media
  where id = p_media_id for update;
  if not found then raise no_data_found using message = 'property media not found'; end if;
  if not (
    (previous_status = 'submitted' and p_status in ('approved', 'rejected'))
    or (previous_status = 'approved' and p_status = 'withdrawn')
    or (previous_status in ('rejected', 'withdrawn') and p_status = 'submitted')
  ) then
    raise check_violation using message = 'invalid media status transition';
  end if;
  if p_status = 'approved' and p_rights_confirmed is distinct from true then
    raise check_violation using message = 'media approval requires rights confirmation';
  end if;
  update public.property_media set verification_status = p_status where id = p_media_id;
  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor, 'property_media', p_media_id::text, 'status_changed',
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', p_status, 'rightsConfirmed', p_rights_confirmed is true)
  );
  return p_status;
end;
$$;

revoke all on function public.add_property_media(uuid,text,text,text,boolean) from public, anon;
revoke all on function public.update_property_media(uuid,text,text,boolean,integer) from public, anon;
revoke all on function public.transition_property_media(uuid,public.verification_status,boolean) from public, anon;
grant execute on function public.add_property_media(uuid,text,text,text,boolean) to authenticated;
grant execute on function public.update_property_media(uuid,text,text,boolean,integer) to authenticated;
grant execute on function public.transition_property_media(uuid,public.verification_status,boolean) to authenticated;
