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
  'NGN 14,000,000',
  600,
  'Developer inventory',
  'Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. Current price and availability must be reconfirmed before payment.',
  '["600 sqm virgin land", "NGN 14,000,000 current developer price", "Direct KYC Interproject Limited inventory", "4-bedroom fully detached duplex development format", "Physical and remote inspection available", "Full or part payment options subject to approved terms"]'::jsonb,
  now(),
  now()
)
on conflict (reference) do nothing;

-- Bootstrap the first administrator after creating their Supabase Auth user:
-- insert into public.staff_profiles (user_id, display_name, role)
-- values ('AUTH-USER-UUID', 'Hafiz Bashir', 'administrator');
