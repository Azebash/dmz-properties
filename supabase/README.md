# Supabase Development

Supabase is the canonical owner of DMZ operational records. The public website remains file-backed until the database publishing path is explicitly enabled.

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

Public sign-up is disabled. Create a staff user through Supabase Auth, then run this through the SQL editor using the Auth user UUID:

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
