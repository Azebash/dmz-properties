create function private.is_virgin_land_type(p_type text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select lower(coalesce(p_type, '')) ~ '(^|[^a-z0-9])(land|plots?)([^a-z0-9]|$)'
$$;

create function private.enforce_property_media_classification()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  property_type text;
begin
  select p.property_type into property_type from public.properties p
  where p.id = new.property_id;
  if private.is_virgin_land_type(property_type) and not new.estate_context then
    raise check_violation using message = 'land photographs must be estate context';
  end if;
  return new;
end;
$$;

create trigger property_media_land_classification
before insert or update of property_id, estate_context on public.property_media
for each row execute function private.enforce_property_media_classification();

create function private.prevent_land_media_conflict()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if private.is_virgin_land_type(new.property_type)
    and exists (select 1 from public.property_media m
      where m.property_id = new.id and not m.estate_context) then
    raise check_violation using message = 'reclassify property photos as estate context before changing to land';
  end if;
  return new;
end;
$$;

create trigger properties_land_media_change
before update of property_type on public.properties
for each row execute function private.prevent_land_media_conflict();

revoke all on function private.is_virgin_land_type(text) from public;
revoke all on function private.enforce_property_media_classification() from public;
revoke all on function private.prevent_land_media_conflict() from public;
