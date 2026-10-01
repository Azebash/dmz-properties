-- Optional showcases share the existing property publisher and audit boundary.
alter table public.properties add column is_featured boolean not null default false;

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
      plot_size_sqm, ownership_label, description, features, is_featured, seo_title,
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
      coalesce((p_payload ->> 'isFeatured')::boolean, false),
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
      is_featured = coalesce((p_payload ->> 'isFeatured')::boolean, is_featured),
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

create or replace function public.transition_property_status(
  p_property_id uuid,
  p_status public.property_status
)
returns public.property_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_status public.property_status;
  verified_at timestamptz;
begin
  if not private.has_staff_role(
    array['administrator', 'property_manager']::public.staff_role[]
  ) then
    raise insufficient_privilege using message = 'property transition is not permitted';
  end if;

  select status, last_verified_at into previous_status, verified_at
  from public.properties
  where id = p_property_id
  for update;

  if previous_status is null then
    raise no_data_found using message = 'property not found';
  end if;

  if not (
    (previous_status = 'draft' and p_status in ('under_review', 'published', 'archived'))
    or (previous_status = 'under_review' and p_status in ('draft', 'published', 'archived'))
    or (previous_status = 'published' and p_status in ('under_review', 'reserved', 'sold', 'archived'))
    or (previous_status = 'reserved' and p_status in ('published', 'sold', 'archived'))
    or (previous_status = 'sold' and p_status = 'archived')
  ) then
    raise check_violation using message = 'invalid property status transition';
  end if;

  if p_status = 'published' and verified_at is null then
    raise check_violation using message = 'property must be verified before publication';
  end if;

  update public.properties set
    status = p_status,
    published_at = case
      when p_status = 'published' then coalesce(published_at, now())
      else published_at
    end,
    updated_by = actor
  where id = p_property_id;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    actor,
    'property',
    p_property_id::text,
    'status_changed',
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', p_status)
  );

  return p_status;
end;
$$;


-- Keep the price independent of public inventory. Do not advance its source date.
do $$
declare
  benchmark jsonb;
  previous_guide jsonb;
  next_guide jsonb;
begin
  select jsonb_build_object('amount', price_amount, 'plotSizeSqm', plot_size_sqm,
    'confirmedAt', (last_verified_at at time zone 'Africa/Lagos')::date::text, 'visible', true)
  into benchmark from public.properties
  where reference = 'DMZ-KYC-001' and source = 'developer_inventory'
    and price_currency = 'NGN' and price_amount > 0 and plot_size_sqm > 0
    and last_verified_at is not null;
  select to_jsonb(g.*) into previous_guide from public.area_guides g
    where slug = 'kyc-homes-phase-ii' for update;
  update public.area_guides set
    draft_copy = draft_copy || jsonb_build_object('developerPrice', benchmark),
    published_copy = case when published_copy is null then null else
      published_copy || jsonb_build_object('developerPrice', benchmark) end
  where slug = 'kyc-homes-phase-ii';
  select to_jsonb(g.*) into next_guide from public.area_guides g where slug = 'kyc-homes-phase-ii';
  if previous_guide is not null then
    insert into public.audit_events (entity_type, entity_id, action, previous_value, next_value)
    values ('area_guide', 'kyc-homes-phase-ii', 'developer_benchmark_initialized', previous_guide, next_guide);
  end if;
end;
$$;

-- Validate the benchmark at the database boundary as well as in the editor.
create function private.validate_area_developer_price()
returns trigger language plpgsql set search_path = '' as $$
declare
  copy jsonb;
  price jsonb;
  confirmed date;
begin
  foreach copy in array array[new.draft_copy, new.published_copy] loop
    price := copy -> 'developerPrice';
    if price is null or price = 'null'::jsonb then continue; end if;
    if jsonb_typeof(price) is distinct from 'object'
      or jsonb_typeof(price -> 'amount') is distinct from 'number'
      or jsonb_typeof(price -> 'plotSizeSqm') is distinct from 'number'
      or jsonb_typeof(price -> 'visible') is distinct from 'boolean'
      or jsonb_typeof(price -> 'confirmedAt') is distinct from 'string'
      or (price ->> 'confirmedAt') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise check_violation using message = 'developer benchmark is invalid';
    end if;
    if (price ->> 'amount')::numeric <= 0 or (price ->> 'amount')::numeric > 1e12
      or (price ->> 'plotSizeSqm')::numeric <= 0 or (price ->> 'plotSizeSqm')::numeric > 1e7 then
      raise check_violation using message = 'developer benchmark is invalid';
    end if;
    begin
      confirmed := (price ->> 'confirmedAt')::date;
    exception when others then
      raise check_violation using message = 'developer benchmark date is invalid';
    end;
    if confirmed > (now() at time zone 'Africa/Lagos')::date then
      raise check_violation using message = 'developer benchmark date is invalid';
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function private.validate_area_developer_price() from public, anon, authenticated;
create trigger validate_area_developer_price before insert or update on public.area_guides
for each row execute function private.validate_area_developer_price();
