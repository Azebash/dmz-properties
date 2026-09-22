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

`NEXT_PUBLIC_GA_ID` is optional. The remaining email values are required for enquiry delivery.
When Google Analytics is configured, it loads only after the visitor explicitly accepts optional analytics.

## Content

Property and article records currently live in `src/lib/content.ts`. Only confirmed developer inventory is published. Public-facing photography uses the supplied KYC Homes Phase II image library and is identified as estate context until listing-specific media is supplied.

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
