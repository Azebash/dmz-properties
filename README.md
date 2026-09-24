# DMZ Properties

Content-led property sales and advisory website for DMZ Properties, a venture of DMZ Enterprises Ltd (RC 9121009).

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4 with a custom CSS design system
- Resend HTTP API for enquiry delivery
- Supabase Postgres, Auth, and Storage for the operational admin platform

## Local Development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Required Configuration

Set these values in `.env.local` and in the production hosting environment:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
RESEND_API_KEY=your-resend-api-key
ENQUIRY_TO_EMAIL=your-inbox@example.com
ENQUIRY_FROM_EMAIL=DMZ Properties <enquiries@your-verified-domain.com>
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Supabase environment variables are required for staff access and durable enquiries.
Resend email variables and `NEXT_PUBLIC_GA_ID` are optional; enquiries persist to
Supabase even if notification delivery is unavailable.
When Google Analytics is configured, it loads only after the visitor explicitly accepts optional analytics.

## Content

Published property listings come from Supabase when
`SUPABASE_CONTENT_SOURCE=database`; the verified developer record in
`src/lib/content.ts` remains a controlled rollback source. Its approved estate
photos stay labelled as context, never as a picture of the specific virgin plot.
The property editor now has a locally verified private-photo workflow: staff
choose estate context or an exact-property image, provide alt text and a
caption, set display order, and approve rights before public display. Accepted
JPEG, PNG and WebP files are normalized to WebP without source metadata. Land
photos can only be estate context; offer letters are never uploaded to the
photo gallery. The media UI and image proxy are not deployed yet.
The property-read cutover is deployed and verified on the Vercel site; approved
Supabase listings now drive the homepage, catalogue, detail pages, area cards,
search metadata, and sitemap.
Price references on the area page, FAQs, and printable buyer guide follow the
published developer listing. Older dated articles may need a separate editor
review when that price changes.
Articles are seeded in Supabase and edited at `/admin/content`; published records
power the homepage, Insights, topic pages, and sitemap when
`SUPABASE_CONTENT_SOURCE=database`. The repository article records are retained
as a controlled rollback source. Editors can preview a saved draft or reviewed
article from its edit page without publishing it. Administrators can review
editorial changes and publication transitions on that page. Public-facing photography uses the supplied
KYC Homes Phase II image library and is identified as estate context until
listing-specific media is supplied.

The KYC Homes Phase II area guide has a protected copy editor at
`/admin/areas/kyc-homes-phase-ii`. Draft and reviewed text does not replace the
approved public page until publication. Estate facts, prices, imagery, and
purchase guidance remain fixed in the page template.

Administrator-only staff governance at `/admin/staff` grants roles to existing
Supabase Auth users, changes access, and assigns an enquiry with its inspection.
Role changes and ownership handoffs are audited. Staff must have their own
confirmed Auth account and password before access is granted; invitation
onboarding is not yet enabled in the app.
Only administrators and property managers may view buyer, inspection, or seller
records. The same roles may edit published property details with an audit event;
new property listings still require review and publication.
Virgin-land listings use estate-context photography, explicitly identified as
not a picture of the exact plot; offer-letter details remain private.

Staff can start a dated estate update from `/admin/content` using **Add estate
update**. Published updates appear on the KYC Homes Phase II page and in
Insights; draft, reviewed, and archived updates stay off public pages. No
unverified development progress is seeded into the feed.

Estate media utilities:

```bash
node scripts/create-contact-sheets.mjs public/images/kyc_homes_phase_2 ./contact-sheets
node scripts/optimize-estate-images.mjs
```

Primary content routes:

- `/properties`
- `/areas/kyc-homes-phase-ii`
- `/insights`
- `/verification`
- `/buying-from-abroad`
- `/sell`
- `/faqs`
- `/contact`

The internal brand presentation is available at `/brand-preview` and is excluded from search indexing.

## Quality Checks

```bash
npm test
npm run test:e2e
npm run test:production
npm run lint
npm run build
```

Use `FEATURE_TRACKER.md` as the source of truth for completed work, launch blockers, and future development.
Use `DEPLOYMENT.md` for production environment, email, domain, monitoring, and launch procedures.
Use `supabase/README.md` for database migrations, RLS tests, type generation, and staff bootstrap.
