create extension if not exists pgcrypto;
create schema if not exists private;

create type public.staff_role as enum (
  'administrator',
  'property_manager',
  'content_editor',
  'viewer'
);

create type public.publication_status as enum (
  'draft',
  'under_review',
  'published',
  'archived'
);

create type public.property_status as enum (
  'draft',
  'under_review',
  'published',
  'reserved',
  'sold',
  'archived'
);

create type public.property_source as enum (
  'developer_inventory',
  'owner_resale'
);

create type public.enquiry_status as enum (
  'new',
  'qualified',
  'inspection',
  'offer',
  'won',
  'lost',
  'spam'
);

create type public.inspection_status as enum (
  'requested',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create type public.verification_status as enum (
  'submitted',
  'reviewing',
  'more_information_required',
  'approved',
  'rejected',
  'withdrawn'
);

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 120),
  role public.staff_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  slug text not null unique,
  title text not null,
  source public.property_source not null,
  property_type text not null,
  status public.property_status not null default 'draft',
  location_name text not null,
  address text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  price_amount numeric(15, 2) check (price_amount is null or price_amount >= 0),
  price_currency char(3) not null default 'NGN',
  price_label text,
  plot_size_sqm numeric(12, 2) check (plot_size_sqm is null or plot_size_sqm > 0),
  ownership_label text,
  description text not null,
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  updated_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_property_has_timestamp check (
    status <> 'published' or published_at is not null
  )
);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  alt_text text not null,
  caption text,
  estate_context boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  document_type text not null,
  display_name text not null,
  verification_status public.verification_status not null default 'submitted',
  notes text,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  status public.publication_status not null default 'draft',
  excerpt text not null,
  body jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array'),
  read_time_minutes integer not null default 1 check (read_time_minutes > 0),
  seo_title text,
  seo_description text,
  author_id uuid references public.staff_profiles(user_id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_article_has_timestamp check (
    status <> 'published' or published_at is not null
  )
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  status public.enquiry_status not null default 'new',
  enquiry_type text not null,
  property_id uuid references public.properties(id) on delete set null,
  property_reference text,
  name text not null,
  email text not null,
  phone text not null,
  current_location text,
  budget text,
  purchase_timeline text,
  inspection_preference text,
  inspection_date date,
  alternate_date date,
  time_zone text,
  preferred_contact_method text,
  preferred_contact_time text,
  message text not null,
  attribution jsonb not null default '{}'::jsonb check (jsonb_typeof(attribution) = 'object'),
  privacy_consent_at timestamptz not null,
  assigned_to uuid references public.staff_profiles(user_id) on delete set null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.enquiries(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  status public.inspection_status not null default 'requested',
  inspection_type text not null,
  preferred_date date not null,
  alternate_date date,
  time_zone text not null,
  scheduled_at timestamptz,
  assigned_to uuid references public.staff_profiles(user_id) on delete set null,
  outcome_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_submissions (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.enquiries(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  status public.verification_status not null default 'submitted',
  owner_name text not null,
  owner_phone text not null,
  owner_email text,
  property_description text not null,
  asking_price numeric(15, 2) check (asking_price is null or asking_price >= 0),
  review_notes text,
  reviewed_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.staff_profiles(user_id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  previous_value jsonb,
  next_value jsonb,
  created_at timestamptz not null default now()
);

create index properties_status_published_idx on public.properties(status, published_at desc);
create index properties_source_idx on public.properties(source);
create index property_media_property_idx on public.property_media(property_id, sort_order);
create index property_documents_property_idx on public.property_documents(property_id);
create index articles_status_published_idx on public.articles(status, published_at desc);
create index articles_category_idx on public.articles(category);
create index enquiries_status_created_idx on public.enquiries(status, created_at desc);
create index enquiries_assigned_to_idx on public.enquiries(assigned_to);
create index inspections_status_date_idx on public.inspections(status, preferred_date);
create index inspections_assigned_to_idx on public.inspections(assigned_to);
create index seller_submissions_status_idx on public.seller_submissions(status, created_at desc);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);
create index audit_events_actor_idx on public.audit_events(actor_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staff_profiles_updated_at before update on public.staff_profiles
for each row execute function private.set_updated_at();
create trigger properties_updated_at before update on public.properties
for each row execute function private.set_updated_at();
create trigger property_documents_updated_at before update on public.property_documents
for each row execute function private.set_updated_at();
create trigger articles_updated_at before update on public.articles
for each row execute function private.set_updated_at();
create trigger enquiries_updated_at before update on public.enquiries
for each row execute function private.set_updated_at();
create trigger inspections_updated_at before update on public.inspections
for each row execute function private.set_updated_at();
create trigger seller_submissions_updated_at before update on public.seller_submissions
for each row execute function private.set_updated_at();

create function private.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.staff_profiles
  where user_id = (select auth.uid()) and active = true
$$;

create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_staff_role() is not null
$$;

create function private.has_staff_role(allowed public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_staff_role() = any(allowed)
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.current_staff_role() from public;
revoke all on function private.is_staff() from public;
revoke all on function private.has_staff_role(public.staff_role[]) from public;
grant execute on function private.current_staff_role() to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.has_staff_role(public.staff_role[]) to authenticated;

alter table public.staff_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.property_documents enable row level security;
alter table public.articles enable row level security;
alter table public.enquiries enable row level security;
alter table public.inspections enable row level security;
alter table public.seller_submissions enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.staff_profiles from anon, authenticated;
revoke all on table public.properties from anon, authenticated;
revoke all on table public.property_media from anon, authenticated;
revoke all on table public.property_documents from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.enquiries from anon, authenticated;
revoke all on table public.inspections from anon, authenticated;
revoke all on table public.seller_submissions from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select on public.properties, public.property_media, public.articles to anon;
grant select on public.staff_profiles to authenticated;
grant select on public.properties to authenticated;
grant select on public.property_media to authenticated;
grant select on public.property_documents to authenticated;
grant select on public.articles to authenticated;
grant select on public.enquiries to authenticated;
grant select on public.inspections to authenticated;
grant select on public.seller_submissions to authenticated;
grant select on public.audit_events to authenticated;

create policy "Users read own staff profile"
on public.staff_profiles for select to authenticated
using (user_id = (select auth.uid()));
create policy "Administrators read all staff profiles"
on public.staff_profiles for select to authenticated
using (private.has_staff_role(array['administrator']::public.staff_role[]));

create policy "Public reads published properties"
on public.properties for select to anon, authenticated
using (status = 'published');
create policy "Staff reads all properties"
on public.properties for select to authenticated
using (private.is_staff());

create policy "Public reads media for published properties"
on public.property_media for select to anon, authenticated
using (exists (
  select 1 from public.properties p
  where p.id = property_id and p.status = 'published'
));
create policy "Staff reads all property media"
on public.property_media for select to authenticated
using (private.is_staff());

create policy "Staff reads property documents"
on public.property_documents for select to authenticated using (private.is_staff());

create policy "Public reads published articles"
on public.articles for select to anon, authenticated
using (status = 'published');
create policy "Staff reads all articles"
on public.articles for select to authenticated using (private.is_staff());

create policy "Staff reads enquiries"
on public.enquiries for select to authenticated using (private.is_staff());

create policy "Staff reads inspections"
on public.inspections for select to authenticated using (private.is_staff());

create policy "Staff reads seller submissions"
on public.seller_submissions for select to authenticated using (private.is_staff());

create policy "Administrators read audit events"
on public.audit_events for select to authenticated
using (private.has_staff_role(array['administrator']::public.staff_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-media', 'property-media', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('seller-documents', 'seller-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Staff reads property media objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'property-media'
  and private.is_staff()
);
create policy "Property staff reads seller documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'seller-documents'
  and private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[])
);
