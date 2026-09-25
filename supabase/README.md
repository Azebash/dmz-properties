# Supabase Development

Supabase is the canonical owner of DMZ operational records. Published
properties, articles, and area-guide copy use its database read path;
repository property records are retained only as a controlled rollback.

## Requirements

- Node.js 22 or newer
- Docker Desktop running
- Supabase CLI from the project dev dependencies

## Local Setup

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run supabase:types
```

If Docker is unavailable but the repository is linked and
`SUPABASE_DB_PASSWORD` is present in `.env.local`, run the same transactional
policy suite against the linked project:

```bash
npm run supabase:test:linked
```

Copy the local project URL and publishable key into `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-publishable-key
SUPABASE_SECRET_KEY=local-secret-key
SUPABASE_PERSIST_ENQUIRIES=true
```

## First Administrator

Public sign-up is disabled. Create a confirmed staff user with a password
through Supabase Auth, then run this through the SQL editor using that Auth
user UUID:

```sql
insert into public.staff_profiles (user_id, display_name, role)
values ('AUTH-USER-UUID', 'Hafiz Bashir', 'administrator');
```

## Security Gate

Do not enable admin mutations or database-backed public publishing until:

1. `npm run supabase:reset` succeeds.
2. `npm run supabase:test` passes every RLS assertion.
3. Generated types match the migration.
4. A non-staff authenticated account is denied admin data.
5. Anonymous access returns only published properties, published articles, and public property media.

The Supabase secret key is server-only and must never use the `NEXT_PUBLIC_` prefix.

The committed `database.types.ts` was generated from the linked project after the initial migrations. Regenerate it after every schema change; generated relationships are authoritative.

Staff governance is tested by `staff_governance.test.sql`: only administrators
can grant roles and assign enquiry/inspection ownership, and content editors or
viewers cannot read private lead records. With a local production server on
port 3100 and Node.js 22, run `npm run test:linked-staff:governance` with
`DMZ_VERIFY_SITE_URL=http://localhost:3100` to create and remove a synthetic
confirmed Auth user without sending an email. `npm run test:live-staff-workflows`
also passed against the deployed staff UI with temporary linked records removed.

`npm run test:linked-public-property` uses the same local site and linked
database to create a synthetic draft property, review and publish it, verify
the public listing and neutral media placeholder, edit it, reserve it, and
remove the property and audit records. The current developer plot's published
copy was reconciled only if its database row still matched the original seed.
`npm run test:live-published-property` performs a read-only production check of
the original URL, price, last-reviewed date, curated context imagery, structured
data, area guide, FAQs, printable guide, and sitemap.

`property_media_workflow.test.sql` verifies that photos remain private until
approved, exact-plot photos are rejected for land, rights confirmation is
required, video cannot enter the image gallery, and withdrawal revokes anonymous
access. `npm run test:linked-media-concurrency` checks two conflicting
classification changes against linked Postgres and removes its draft fixtures.
With a local production
server on port 3100 and Node.js 22, run `npm run test:linked-property-media`
with `DMZ_VERIFY_SITE_URL=http://localhost:3100` to upload a real WebP from the
curated estate gallery, review it, verify public access only while approved,
then remove the temporary file, media row, and audit records. On Node.js 22,
`npm run test:live-property-media` repeats the reversible check against the
canonical production URL without requiring a local server.

`private_property_documents.test.sql` checks staff-only document metadata,
audited internal review and withdrawal, and a PDF-only private bucket. With a
local production server on port 3100 and Node.js 22, run
`npm run test:linked-property-documents` to upload and retrieve a generated
synthetic PDF, prove anonymous downloads redirect to staff login, and remove
all temporary records and bytes. After production rollout, use
`npm run test:live-property-documents` for the reversible live check. Both
checks passed after rollout; the generated PDF and its temporary records were
removed. Internal document approval never creates a public download.

`property_availability.test.sql` checks that publication does not imply stock,
that only property staff can record an audited confirmation with a server-issued
timestamp, and that reservation and republication clear previous confirmations.
Run `npm run test:linked-property-availability` with a local production server
on port 3100 and Node.js 22 to check the staff UI and public filter against the
real unconfirmed developer listing without changing inventory claims. Run
`npm run test:live-property-availability` only after application rollout.

To verify the authenticated operations after a production deployment, run
`npm run test:live-workflows` with local staff credentials and a server-only
Supabase secret in `.env.local`. The test creates an inspection request, updates
it through the admin UI, checks the audit records, and removes all fixture data.

`npm run test:live-public-forms` submits synthetic buyer, seller, and
inspection requests through the deployed public forms, verifies the persisted
enquiries and related review/inspection records, verifies the honeypot accepts
without persistence, then checks that the fixtures, child rows, and audit records
are removed. Email notifications need separate verification once configured.

After enabling `SUPABASE_CONTENT_SOURCE=database`, run
`npm run test:live-editorial`. It creates a draft, verifies it is private,
checks the protected saved-article preview, publishes and edits it through the
staff UI, confirms the public URL, archives it, checks audit history, and removes
the temporary article and audit records.
Run `npm run test:live-estate-updates` for the same workflow with the estate-update
entry point and checks that the area page shows only published updates.

Run `npm run test:live-area-guide` to verify protected guide editing, draft
privacy, review, publication, search metadata, and the unchanged public URL.
The test restores the approved guide copy and removes its temporary audit
entries. If direct `supabase db push --linked` cannot reach the database,
`npm run supabase:push:linked:pooler` applies pending migrations through the
linked project pooler using the local `SUPABASE_DB_PASSWORD`.
