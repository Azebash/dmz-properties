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

The editorial catalogue defaults to repository files when the variable is absent.
Seed and verify the existing slugs and area-guide copy before enabling `database`.
Only published Supabase articles appear on the homepage, Insights, topic pages,
and sitemap; the area page reads only the last approved guide copy. A database
outage will surface an error rather than quietly restore stale file content.
Set `repository` and redeploy only for a controlled rollback.

## Domain And Search

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
