# DMZ Properties Deployment Runbook

## Current Status

The application is production-buildable and has automated unit, API, browser, accessibility, metadata, and performance checks. Public launch remains blocked by the business inputs listed in `FEATURE_TRACKER.md`.

## Hosting

Recommended host: Vercel, using the existing Next.js application defaults.

Build settings:

```text
Install command: npm install
Build command: npm run build
Output: Next.js default
Node.js: 22 or newer
```

Do not set a production domain in code. `NEXT_PUBLIC_SITE_URL` must contain the final canonical HTTPS origin. Until then, Vercel's deployment URL is used automatically.

## Required Environment Variables

```text
NEXT_PUBLIC_SITE_URL=https://final-domain.example
NEXT_PUBLIC_ALLOW_INDEXING=false
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=publishable-key
SUPABASE_SECRET_KEY=secret-key
SUPABASE_PERSIST_ENQUIRIES=true
SUPABASE_CONTENT_SOURCE=database
RESEND_API_KEY=secret
ENQUIRY_TO_EMAIL=verified-business-inbox@example.com
ENQUIRY_FROM_EMAIL=DMZ Properties <enquiries@verified-domain.example>
```

Optional:

```text
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_TURNSTILE_SITE_KEY=public-site-key
TURNSTILE_SECRET_KEY=secret-key
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=secret-token
```

Never commit production values. Configure them in the hosting provider's encrypted environment settings.

Keep `NEXT_PUBLIC_ALLOW_INDEXING=false` throughout staging. Change it to `true` only after every P0 launch gate is approved and the canonical domain is active.

Turnstile and Upstash are optional in local development but should be configured together for public traffic. Without Upstash, rate limiting falls back to the current server process and is not distributed across serverless instances.

## Email Setup

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
Seed and verify the existing slugs before enabling `database`. Only published
Supabase articles are then visible on the homepage, Insights, topic pages, and
sitemap; a database outage will surface an error rather than quietly restore
stale file content. Set `repository` and redeploy only for a controlled rollback.

## Domain And Search

1. Connect the final domain and confirm SSL.
2. Set `NEXT_PUBLIC_SITE_URL` to the canonical origin without a trailing slash.
3. Verify `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` on production.
4. Add the domain to Google Search Console and Bing Webmaster Tools.
5. Submit the sitemap only after representative content is removed and legal review is complete.
6. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` and redeploy only when the production site is approved for discovery.

## Monitoring

- Health endpoint: `/api/health`
- Readiness endpoint: `/api/ready` returns HTTP 503 until required production services are configured.
- Configure an external uptime check against the health endpoint.
- Vercel logs receive structured `server_request_error` events from `src/instrumentation.ts`.
- Add an alerting provider before traffic grows; console logging alone does not provide incident notification.

## Required Pre-Launch Evidence

```bash
npm audit
npm test
npm run lint
npm run test:e2e
npm run test:production
```

All commands must pass against the final production configuration.

## Manual Business Gates

- Confirm the exact land title type and approved public wording.
- Obtain the current payment schedule and amounts for all post-allocation charges.
- Confirm the live allocation count or avoid publishing a quantity.
- Approve every owner resale record before publication.
- Confirm rights to publish all supplied estate photographs.
- Obtain legal review of privacy, terms, payment, and relationship disclosures.
- Approve the final logo before producing print assets.
