-- Preserve the historical price without treating a dated guide as live inventory.
do $$
declare
  article_id uuid;
  previous_row jsonb;
  next_row jsonb;
begin
  select id, to_jsonb(a.*) into article_id, previous_row
  from public.articles a
  where slug = 'kyc-homes-phase-ii-abuja-guide'
    and status = 'published'
    and body -> 3 ->> 'heading' = 'Current developer product and price'
    and body -> 3 ->> 'body' = 'KYC Interproject Limited''s current virgin-land price is NGN 14,000,000 for a 600 sqm plot. Phase II follows a 4-bedroom fully detached duplex development format. Full or part payment may be available, but buyers must reconfirm availability, charges, payment schedules, and official instructions before transferring funds.'
  for update;
  if article_id is null then return; end if;

  update public.articles set body = jsonb_set(
    jsonb_set(body, '{3,heading}', to_jsonb('Developer product at publication'::text)),
    '{3,body}',
    to_jsonb('At this guide''s original publication on 17 September 2026, KYC Interproject Limited''s quoted virgin-land price was NGN 14,000,000 for a 600 sqm plot. Phase II follows a 4-bedroom fully detached duplex development format. Full or part payment may be available, but buyers must reconfirm availability, charges, payment schedules, and official instructions before transferring funds.'::text)
  ) where id = article_id
  returning to_jsonb(articles.*) into next_row;

  insert into public.audit_events (
    actor_id, entity_type, entity_id, action, previous_value, next_value
  ) values (
    null, 'article', article_id::text, 'publication_copy_qualified',
    previous_row, next_row
  );
end;
$$;
