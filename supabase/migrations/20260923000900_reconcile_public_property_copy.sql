-- Copy previously published repository wording into the matching seed row only.
-- A staff-edited database row is not overwritten by this migration.
do $$
declare
  old_row jsonb;
  next_row jsonb;
  property_id uuid;
begin
  select id, to_jsonb(p.*) into property_id, old_row
  from public.properties p
  where reference = 'DMZ-KYC-001'
    and slug = '600sqm-virgin-land-kyc-homes-phase-ii'
    and status = 'published'
    and description = 'Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II. Current price and availability must be reconfirmed before payment.'
    and features = '["600 sqm virgin land", "Current developer price: NGN 14,000,000", "Direct KYC Interproject Limited inventory", "Physical and remote inspection available"]'::jsonb
  for update;
  if property_id is null then return; end if;

  update public.properties set
    description = 'Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. Current price and availability must be reconfirmed before payment.',
    features = '["600 sqm virgin land", "NGN 14,000,000 current developer price", "Direct KYC Interproject Limited inventory", "4-bedroom fully detached duplex development format", "Physical and remote inspection available", "Full or part payment options subject to approved terms"]'::jsonb
  where id = property_id
  returning to_jsonb(properties.*) into next_row;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    null, 'property', property_id::text, 'seed_copy_reconciled', old_row, next_row
  );
end;
$$;
