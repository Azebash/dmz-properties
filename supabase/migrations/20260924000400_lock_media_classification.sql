-- Existing inconsistent rows require manual review; never silently relabel a photo.
do $$
begin
  if exists (
    select 1 from public.property_media m
    join public.properties p on p.id = m.property_id
    where private.is_virgin_land_type(p.property_type) and not m.estate_context
  ) then
    raise check_violation using message = 'existing virgin-land media requires classification review';
  end if;
end;
$$;

alter table public.property_media add constraint approved_property_media_is_image
check (verification_status <> 'approved' or media_type = 'image');

create or replace function private.enforce_property_media_classification()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  property_type text;
begin
  -- Same parent row lock as property-type updates: either mutation sees the
  -- other's committed classification and fails before a conflicting commit.
  select p.property_type into property_type from public.properties p
  where p.id = new.property_id for update;
  if not found then raise no_data_found using message = 'property not found'; end if;
  if private.is_virgin_land_type(property_type) and not new.estate_context then
    raise check_violation using message = 'land photographs must be estate context';
  end if;
  return new;
end;
$$;
