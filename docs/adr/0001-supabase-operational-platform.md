# ADR 0001: Use Supabase for DMZ operational data

- Status: Accepted
- Date: 2026-09-18

## Context

DMZ Properties currently publishes property and article data from repository files and sends enquiries by email. The planned admin needs durable listings, articles, enquiries, inspections, seller reviews, private documents, staff roles, and audit history. A CMS-only product would leave operational workflows split across systems.

## Decision Drivers

- One authoritative owner for business records
- Secure staff authentication without custom password handling
- Public and private file storage
- Row-level authorization enforced below the UI
- A path from property advisory into future development operations
- A free starting tier without locking domain policy into a vendor SDK

## Alternatives Considered

### Neon, Clerk, and object storage

Strong composability and database branching, but requires three vendors and more identity/storage integration before the first admin workflow works.

### Sanity plus a separate CRM

Excellent editorial experience, but splits listings/content from enquiries, inspections, sellers, and audit history.

### Repository files only

Simple and currently reliable, but provides no secure business-facing admin, durable lead workflow, or concurrent editing.

## Decision

Use Supabase Postgres as the canonical owner of operational records, Supabase Auth for staff identity, Supabase Storage for public property media and private seller documents, and Row Level Security for database authorization.

The Next.js application owns domain validation and workflows. Supabase owns persistence, identity primitives, storage access, and row enforcement. Email remains an outbound notification, not the system of record.

Public pages will continue reading repository content until the corresponding Supabase read path, seed data, RLS tests, and fallback behavior are proven. This prevents an unconfigured external service from breaking the current website.

## Ownership

| Concern | Canonical owner |
| --- | --- |
| Staff identity and sessions | Supabase Auth |
| Staff role and active status | `staff_profiles` |
| Property publication state | `properties` |
| Property media metadata | `property_media` |
| Private verification documents | `property_documents` and private Storage bucket |
| Editorial content | `articles` |
| Buyer and seller leads | `enquiries` |
| Inspection workflow | `inspections` |
| Seller verification workflow | `seller_submissions` |
| Mutation history | `audit_events` |
| Domain validation and transitions | Next.js server modules |

## Security Boundaries

- Every exposed table has RLS enabled and explicit grants.
- Anonymous users can read only published properties, published articles, and public property media.
- Staff permissions come from `staff_profiles`, never user-editable metadata.
- Admin pages verify signed claims and active staff membership server-side.
- The service-role/secret key remains server-only and is reserved for trusted ingestion such as public enquiry persistence.
- Seller documents use a private bucket and are never linked from public records.

## Consequences

- Supabase becomes a production dependency for admin operations.
- Public rendering remains available while Supabase is absent during this migration stage.
- Database migrations and RLS tests become mandatory release evidence.
- Free projects can pause after inactivity and do not provide production-grade backups.
- A future migration is possible because domain types and repositories remain separate from Supabase client construction.

## Implementation Sequence

1. Add reproducible SQL schema, grants, RLS policies, storage buckets, and policy tests.
2. Add cookie-backed Supabase browser/server clients and Next.js 16 Proxy session refresh.
3. Protect `/admin` with verified claims plus active staff membership.
4. Build read-only admin summaries against Supabase. Direct Data API mutations remain revoked.
5. Add property/content mutations with audit events.
6. Persist enquiries before notifications.
7. Move public reads to published database records with repository fallback.

## Verification

- `supabase db reset` applies migrations and seed data.
- `supabase test db` proves anonymous and staff RLS behavior.
- Unit tests cover configuration and domain mapping.
- Browser tests prove login redirects and protected route behavior.
- Existing public-site regression, accessibility, and production suites remain green.

## Rollback

Disable Supabase environment variables and remove admin route exposure. Public pages continue using repository content. Database records remain available for export and no destructive migration of the current public source occurs during the initial stages.
