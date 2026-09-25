# DMZ Properties Deployment Runbook

## Current Status

The application is production-buildable and has automated unit, API, browser, accessibility, metadata, and performance checks. Public launch remains blocked by the business inputs listed in `FEATURE_TRACKER.md`.

## Hosting

Current host: Vercel, using the existing Next.js application defaults.

Build settings:

```text
Install command: npm install
Build command: npm run build
Output: Next.js default
Node.js: 22 or newer
```

Do not set a production domain in code. The current Vercel HTTPS URL is a valid
initial canonical origin. Change `NEXT_PUBLIC_SITE_URL` when a custom domain is chosen.

## Required Environment Variables

```text
NEXT_PUBLIC_SITE_URL=https://dmz-properties.vercel.app
NEXT_PUBLIC_ALLOW_INDEXING=false
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=publishable-key
SUPABASE_SECRET_KEY=secret-key
SUPABASE_PERSIST_ENQUIRIES=true
SUPABASE_CONTENT_SOURCE=database
```

Optional:

```text
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
RESEND_API_KEY=secret
ENQUIRY_TO_EMAIL=verified-business-inbox@example.com
ENQUIRY_FROM_EMAIL=DMZ Properties <enquiries@verified-domain.example>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=public-site-key
TURNSTILE_SECRET_KEY=secret-key
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=secret-token
```

Never commit production values. Configure them in the hosting provider's encrypted environment settings.

Keep `NEXT_PUBLIC_ALLOW_INDEXING=false` until public claims, privacy, content,
and the chosen launch URL are approved. A custom domain is not required for the
initial launch.

Supabase provides distributed rate limiting on the current production enquiry
path. Turnstile and Upstash are optional additions, not launch dependencies.

## Optional Email Setup

Buyer, seller, and inspection forms persist to the protected Supabase inbox
without Resend. Assign a staff member to monitor `/admin/enquiries` and follow
up through the available phone or WhatsApp channels until notifications are
configured.

Property staff can set an Abuja-date next follow-up on an active lead. The
protected inbox shows due and overdue leads in stable, 50-item pages separately
from the recent enquiries list, while the full enquiry table also paginates in
50-item pages, newest first. Both show complete result counts and stable sort
ties; changing either page preserves the other section's current page. The
overview counts all due leads. Closing a
lead as won, lost, or spam clears its reminder in the same audit transaction.
These are on-screen reminders, not email, SMS, or push notifications; a staff
member must still monitor the inbox. `npm run test:live-follow-ups` creates a
synthetic lead, verifies scheduling and closure through the production staff
UI, then removes the temporary lead and audit events.

1. Select the official DMZ Properties domain.
2. Create the official business inbox.
3. Verify the sending domain with Resend using its DNS records.
4. Set `ENQUIRY_TO_EMAIL` to the monitored inbox.
5. Set `ENQUIRY_FROM_EMAIL` to an address on the verified domain.
6. Submit buyer and seller forms from the production site.
7. Confirm internal delivery, buyer acknowledgement, reply-to behavior, and spam handling.

## Supabase Setup

1. Create a Supabase project and keep public sign-up disabled.
2. Link the local project with `npx supabase link`.
3. Review and push `supabase/migrations`.
4. Run `npm run supabase:test` against the local stack before pushing.
5. Generate current types with `npm run supabase:types` after every schema change.
6. Create the first staff user through Supabase Auth.
7. Insert that Auth UUID into `staff_profiles` with role `administrator` using the bootstrap statement in `supabase/seed.sql`.
8. Configure the project URL and publishable key in encrypted hosting variables.
9. Verify `/admin/login`, active-staff authorization, and `/api/ready` in the deployed environment.
10. Create additional confirmed staff accounts with individual passwords in
    Supabase Auth, then assign their role by Auth UUID through `/admin/staff`.
    App-managed invitations remain disabled until a pending-account activation
    workflow is verified.

Local development without Supabase can read repository content by default.
Configured production deployments require an explicit content-source value.
Seed and verify property and article URLs and area-guide copy before enabling
`database`. Only published Supabase properties and articles then appear across
the public pages and sitemap; the area page reads only the last approved guide
copy. Virgin land shows clearly labelled estate-context images; other new
listings without approved media show a placeholder, never a claimed listing
photo. Offer letters remain private. A database outage surfaces an error rather
than quietly restoring stale file content. Set `repository` and redeploy only
for a controlled rollback.

Staff property photos use the private `property-media` Storage bucket. Image
uploads accept JPEG, PNG, and WebP up to 3 MB; uploaded records are private
until a property manager or administrator confirms publication rights and
classification. Exact-property photos are available for developed properties,
while virgin land accepts estate-context images only. The first approved photo
by display order becomes the public cover; withdrawn photos are no longer
served. Never upload offer letters to the photo gallery. Linked database tests
and a reversible live upload/approval/withdrawal check passed after deployment;
run `npm run test:live-property-media` using Node.js 22 to repeat the latter.
The check uses the canonical production URL only with its explicit
`--production` mode and removes its temporary file, metadata, and audit events.
If Vercel logs emit `property_media_orphan_cleanup_failed`, locate that private Storage path,
confirm it has no `property_media` row, then remove it in Supabase Storage.
If `property_media_registration_unknown` appears, first check the row and file
before retrying or deleting either one.

Property paperwork uses the separate private `property-documents` bucket. Only
administrators and property managers can upload and download PDFs (maximum
3 MB). `submitted`, internally verified, rejected, and withdrawn records remain
private; approval does not publish a document or share it with a buyer. A
reversible synthetic PDF check passed on production with temporary bytes,
metadata, and audit events removed. Run `npm run test:live-property-documents`
with Node.js 22 to repeat it. Do not use real offer letters as test fixtures.
For a `property_document_registration_unknown` event, check the row and object
before retrying; for `property_document_orphan_cleanup_failed`, confirm no row
references the private path before removing the object in Supabase Storage.

## Domain And Search

The catalogue's NGN price, plot-size, and sorting controls use shareable URLs;
`npm run test:live-property-discovery` verifies those controls at mobile and
desktop widths without writing production data. Listings without a verified
numeric price or plot size are excluded from the corresponding range filter.
Availability still requires independent confirmation rather than treating
publication as a real-time stock guarantee.
Administrators and property managers can record an audited current-stock check
for a published listing at `/admin/properties/[id]/edit`. Available or on-hold
requires an explicit confirmation that they checked with the owner or developer;
the server writes the timestamp. Public confirmations expire after 14 days,
and changing publication state resets availability. Existing inventory defaults
to "Availability to confirm" and the current developer listing remains there.
`npm run test:live-property-availability` checks the public label, filters and
staff form without asserting or altering business stock.

1. Verify HTTPS on the Vercel launch URL and set `NEXT_PUBLIC_SITE_URL` to the
   chosen canonical origin without a trailing slash.
2. Verify `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` on production.
3. Add the chosen launch URL to Google Search Console and Bing Webmaster Tools
   when the site is approved for search discovery.
4. Submit the sitemap only after representative content is removed and legal review is complete.
5. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` and redeploy only when the production site is approved for discovery.
6. A custom domain and its SSL configuration can be added later; update the
   canonical URL and monitor URL when that happens.

## Monitoring

- Health endpoint: `/api/health`
- Readiness endpoint: `/api/ready` checks core configuration and makes a fresh,
  time-limited Supabase read. HTTP 200 means operationally ready; it does **not**
  certify email delivery, legal approval, or public-launch readiness. A database
  failure returns HTTP 503.
- `/api/health` is a low-cost liveness check. Its nested configuration checks
  are not a substitute for the active dependency check at `/api/ready`.
- Independent Lighthouse homepage baseline on the non-indexed Vercel site (September 23,
  2026): mobile performance 78, desktop 92, accessibility and best practices
  100. SEO 69 reflects the deliberate `noindex` state. The local mobile run
  warned about an unusually slow host CPU; repeat on calibrated hardware.
- A local hero-image `fetchPriority="high"` experiment removed Lighthouse's
  priority hint, but scores moved from 78/78 to 48/52 as the host CPU benchmark
  fell from 605–752 to 252–313. The result cannot establish a performance gain;
  the experiment was reverted. The original trace already showed the preloaded
  hero image at high network priority (181 KB transferred, request complete by
  about 1.9 s) while LCP occurred at 3.7 s. Retest rendering on stable hardware
  before changing LCP loading.
- `.github/workflows/production-availability.yml` is deployed to check
  `/api/health` and the active Supabase-backed `/api/ready` every 15 minutes
  and on manual dispatch. `npm run monitor:production` passes against the live
  deployment; an unhealthy response exits nonzero. GitHub's manual workflow
  dispatch did not start a runner because the account is locked by a billing
  issue (run 35912830359). The workflow was disabled to avoid repeated failed
  scheduled attempts. After the account issue is resolved, run
  `gh workflow enable 365469470 --repo Azebash/dmz-properties`, dispatch it,
  confirm a passing run and workflow-failure notifications (or connect an alert
  provider). Update its URL after a custom domain is selected.
- Vercel logs receive structured `server_request_error` events from `src/instrumentation.ts`.
- Console logging alone does not provide incident notification.

## Required Pre-Launch Evidence

```bash
npm audit
npm test
npm run lint
npm run test:e2e
npm run test:production
npm run test:live-public-forms
npm run test:live-published-property
npm run monitor:production
```

The live form check uses removable synthetic buyer, seller, and inspection
records. It proves browser submission and Supabase persistence; repeat it and
separately verify internal and buyer email delivery after Resend is configured.
All commands must pass against the final production configuration.

## Manual Business Gates

- Confirm the exact land title type and approved public wording.
- Obtain the current payment schedule and amounts for all post-allocation charges.
- Confirm the live allocation count or avoid publishing a quantity.
- Approve every owner resale record before publication.
- Confirm rights to publish all supplied estate photographs.
- Obtain legal review of privacy, terms, payment, and relationship disclosures.
- Approve the final logo before producing print assets.
