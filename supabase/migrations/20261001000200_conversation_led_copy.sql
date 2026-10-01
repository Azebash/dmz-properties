-- Approved copy corrections; preserve unrelated staff edits and confirmation dates.
do $$
declare old_row record; next_row jsonb;
begin
  for old_row in select *, to_jsonb(t.*) as audit_previous from public.properties t where position('Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. Current price and availability must be reconfirmed before payment.' in description::text) > 0 or position('4-bedroom fully detached duplex development format' in features::text) > 0 or position('NGN 14,000,000 current developer price' in features::text) > 0 for update loop
    update public.properties set description = replace(description::text, 'Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. Current price and availability must be reconfirmed before payment.', '600 sqm residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. The listed price is for land. Ask us about the estate’s approved building requirements, current availability, and additional charges.'), features = replace(replace(features::text, '4-bedroom fully detached duplex development format', 'Land only; ask about approved building requirements'), 'NGN 14,000,000 current developer price', '₦14,000,000 current developer price')::jsonb where id = old_row.id;
    select to_jsonb(t.*) into next_row from public.properties t where id = old_row.id;
    insert into public.audit_events(entity_type, entity_id, action, previous_value, next_value)
    values ('property', old_row.id::text, 'buyer_copy_updated', old_row.audit_previous, next_row);
  end loop;
end;
$$;
do $$
declare old_row record; next_row jsonb;
begin
  for old_row in select *, to_jsonb(t.*) as audit_previous from public.articles t where position('Seven questions to ask before buying land' in title::text) > 0 or position('An owner resale transfers an existing client''s interest' in body::text) > 0 or position('Phase II follows a 4-bedroom fully detached duplex development format.' in body::text) > 0 or position('NGN 14,000,000' in body::text) > 0 for update loop
    update public.articles set title = replace(title::text, 'Seven questions to ask before buying land', 'Ownership and costs: checks before buying land'), body = replace(replace(replace(body::text, 'An owner resale transfers an existing client''s interest', 'An owner resale transfers an existing owner''s interest'), 'Phase II follows a 4-bedroom fully detached duplex development format.', 'The quoted price is for land. Ask DMZ about the estate’s approved building requirements.'), 'NGN 14,000,000', '₦14,000,000')::jsonb where id = old_row.id;
    select to_jsonb(t.*) into next_row from public.articles t where id = old_row.id;
    insert into public.audit_events(entity_type, entity_id, action, previous_value, next_value)
    values ('article', old_row.id::text, 'buyer_copy_updated', old_row.audit_previous, next_row);
  end loop;
end;
$$;
do $$
declare old_row record; next_row jsonb;
begin
  for old_row in select *, to_jsonb(t.*) as audit_previous from public.area_guides t where position('Local knowledge without informal shortcuts.' in draft_copy::text) > 0 or position('Local knowledge without informal shortcuts.' in published_copy::text) > 0 for update loop
    update public.area_guides set draft_copy = replace(draft_copy::text, 'Local knowledge without informal shortcuts.', 'Guidance from your first enquiry to purchase.')::jsonb, published_copy = replace(published_copy::text, 'Local knowledge without informal shortcuts.', 'Guidance from your first enquiry to purchase.')::jsonb where slug = old_row.slug;
    select to_jsonb(t.*) into next_row from public.area_guides t where slug = old_row.slug;
    insert into public.audit_events(entity_type, entity_id, action, previous_value, next_value)
    values ('area_guide', old_row.slug, 'buyer_copy_updated', old_row.audit_previous, next_row);
  end loop;
end;
$$;
