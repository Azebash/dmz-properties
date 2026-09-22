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
  'Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II. Current price and availability must be reconfirmed before payment.',
  '["600 sqm virgin land", "Current developer price: NGN 14,000,000", "Direct KYC Interproject Limited inventory", "Physical and remote inspection available"]'::jsonb,
  now(),
  now()
)
on conflict (reference) do update set
  title = excluded.title,
  price_amount = excluded.price_amount,
  price_label = excluded.price_label,
  description = excluded.description,
  features = excluded.features,
  last_verified_at = excluded.last_verified_at;

-- Bootstrap the first administrator after creating their Supabase Auth user:
-- insert into public.staff_profiles (user_id, display_name, role)
-- values ('AUTH-USER-UUID', 'Hafiz Bashir', 'administrator');
