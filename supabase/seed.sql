insert into public.properties (
  reference,
  slug,
  title,
  source,
  property_type,
  status,
  location_name,
  address,
  latitude,
  longitude,
  price_amount,
  price_currency,
  price_label,
  plot_size_sqm,
  ownership_label,
  description,
  features,
  published_at,
  last_verified_at
)
values (
  'DMZ-KYC-001',
  '600sqm-virgin-land-kyc-homes-phase-ii',
  '600 sqm Virgin Land',
  'developer_inventory',
  'Land',
  'published',
  'KYC Homes Phase II',
  'Sabon Lugbe East Layout, Airport Road, Abuja, FCT',
  8.951194,
  7.396083,
  14000000,
  'NGN',
  '₦14,000,000',
  600,
  'Developer inventory',
  '600 sqm residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. The listed price is for land. Ask us about the estate’s approved building requirements, current availability, and additional charges.',
  '["600 sqm virgin land", "₦14,000,000 current developer price", "Direct KYC Interproject Limited inventory", "Land only; ask about approved building requirements", "Physical and remote inspection available", "Full or part payment options subject to approved terms"]'::jsonb,
  '2026-09-17T00:00:00Z',
  '2026-09-17T00:00:00Z'
)
on conflict (reference) do nothing;

-- Bootstrap the first administrator after creating their Supabase Auth user:
-- insert into public.staff_profiles (user_id, display_name, role)
-- values ('AUTH-USER-UUID', 'Hafiz Bashir', 'administrator');

-- A fresh local database receives the historical benchmark after inventory seeding.
-- Existing staff-approved benchmark content is preserved.
update public.area_guides set
  draft_copy = draft_copy || jsonb_build_object('developerPrice', jsonb_build_object(
    'amount', 14000000, 'plotSizeSqm', 600, 'confirmedAt', '2026-09-17', 'visible', true)),
  published_copy = published_copy || jsonb_build_object('developerPrice', jsonb_build_object(
    'amount', 14000000, 'plotSizeSqm', 600, 'confirmedAt', '2026-09-17', 'visible', true))
where slug = 'kyc-homes-phase-ii' and
  (published_copy -> 'developerPrice' is null or published_copy -> 'developerPrice' = 'null'::jsonb)
  and (draft_copy -> 'developerPrice' is null or draft_copy -> 'developerPrice' = 'null'::jsonb);
