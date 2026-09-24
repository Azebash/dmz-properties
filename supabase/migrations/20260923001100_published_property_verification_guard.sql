alter table public.properties add constraint published_property_requires_verification
check (status <> 'published' or last_verified_at is not null);
