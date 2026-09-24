create or replace function public.save_property(p_payload jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  property_id uuid;
  previous_row jsonb;
  next_row jsonb;
  actor uuid := (select auth.uid());
begin
  if not private.has_staff_role(
    array['administrator', 'property_manager']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'property mutation is not permitted';
  end if;
  if coalesce(p_payload ->> 'reference', '') = ''
    or coalesce(p_payload ->> 'slug', '') = ''
    or coalesce(p_payload ->> 'title', '') = ''
    or coalesce(p_payload ->> 'propertyType', '') = ''
    or coalesce(p_payload ->> 'locationName', '') = ''
    or coalesce(p_payload ->> 'description', '') = '' then
    raise check_violation using message = 'required property fields are missing';
  end if;
  if (p_payload ->> 'slug') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise check_violation using message = 'property slug is invalid';
  end if;
  property_id := nullif(p_payload ->> 'id', '')::uuid;

  if property_id is null then
    insert into public.properties (
      reference, slug, title, source, property_type, status, location_name,
      address, latitude, longitude, price_amount, price_currency, price_label,
      plot_size_sqm, ownership_label, description, features, seo_title,
      seo_description, last_verified_at, created_by, updated_by
    ) values (
      upper(p_payload ->> 'reference'), p_payload ->> 'slug', p_payload ->> 'title',
      (p_payload ->> 'source')::public.property_source, p_payload ->> 'propertyType',
      'draft', p_payload ->> 'locationName', nullif(p_payload ->> 'address', ''),
      nullif(p_payload ->> 'latitude', '')::numeric,
      nullif(p_payload ->> 'longitude', '')::numeric,
      nullif(p_payload ->> 'priceAmount', '')::numeric,
      coalesce(nullif(p_payload ->> 'priceCurrency', ''), 'NGN'),
      nullif(p_payload ->> 'priceLabel', ''),
      nullif(p_payload ->> 'plotSizeSqm', '')::numeric,
      nullif(p_payload ->> 'ownershipLabel', ''), p_payload ->> 'description',
      coalesce(p_payload -> 'features', '[]'::jsonb),
      nullif(p_payload ->> 'seoTitle', ''), nullif(p_payload ->> 'seoDescription', ''),
      nullif(p_payload ->> 'lastVerifiedAt', '')::timestamptz, actor, actor
    ) returning id, to_jsonb(properties.*) into property_id, next_row;
    insert into public.audit_events (
      actor_id, entity_type, entity_id, action, next_value
    ) values (actor, 'property', property_id::text, 'created', next_row);
  else
    select to_jsonb(p.*) into previous_row from public.properties p
    where p.id = property_id for update;
    if previous_row is null then
      raise no_data_found using message = 'property not found';
    end if;
    if previous_row ->> 'published_at' is not null
      and (previous_row ->> 'slug' <> p_payload ->> 'slug'
        or previous_row ->> 'reference' <> upper(p_payload ->> 'reference')) then
      raise check_violation using message = 'published property URLs and references cannot change';
    end if;

    update public.properties set
      reference = upper(p_payload ->> 'reference'),
      slug = p_payload ->> 'slug', title = p_payload ->> 'title',
      source = (p_payload ->> 'source')::public.property_source,
      property_type = p_payload ->> 'propertyType',
      location_name = p_payload ->> 'locationName',
      address = nullif(p_payload ->> 'address', ''),
      latitude = nullif(p_payload ->> 'latitude', '')::numeric,
      longitude = nullif(p_payload ->> 'longitude', '')::numeric,
      price_amount = nullif(p_payload ->> 'priceAmount', '')::numeric,
      price_currency = coalesce(nullif(p_payload ->> 'priceCurrency', ''), 'NGN'),
      price_label = nullif(p_payload ->> 'priceLabel', ''),
      plot_size_sqm = nullif(p_payload ->> 'plotSizeSqm', '')::numeric,
      ownership_label = nullif(p_payload ->> 'ownershipLabel', ''),
      description = p_payload ->> 'description',
      features = coalesce(p_payload -> 'features', '[]'::jsonb),
      seo_title = nullif(p_payload ->> 'seoTitle', ''),
      seo_description = nullif(p_payload ->> 'seoDescription', ''),
      last_verified_at = nullif(p_payload ->> 'lastVerifiedAt', '')::timestamptz,
      updated_by = actor
    where id = property_id returning to_jsonb(properties.*) into next_row;
    insert into public.audit_events (
      actor_id, entity_type, entity_id, action, previous_value, next_value
    ) values (actor, 'property', property_id::text, 'updated', previous_row, next_row);
  end if;
  return property_id;
end;
$$;
