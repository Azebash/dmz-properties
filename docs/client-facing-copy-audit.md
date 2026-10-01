# Client-facing copy audit

Reviewed September 30, 2026 against https://dmz-properties.vercel.app at commit `f3ff561`.

## Coverage

Read all 25 public sitemap URLs, including four articles and four topic pages, expanded FAQ answers, shared footer, forms, and `/brand-preview`. Also reviewed source-only empty states and enquiry error messages without submitting production enquiries.

## Confirmed issues corrected locally

| Surface | Live wording or issue | Correction |
| --- | --- | --- |
| Homepage | “Land first. All property types. Focused exclusively…” and “Land is our main offering…” | Buyer-facing property discovery and inspection copy. |
| Properties | Internal sales mix and positioning repeated in the introduction. | Invitation to compare properties and arrange an inspection. |
| About | “Land is our main offering…” and “Our focus stays within…” | Services and firsthand estate knowledge. |
| Terms | “These terms are an operational draft and must be reviewed by local legal counsel before the website is opened to the public.” | Removed the internal task reminder. Legal-review status remains tracked in `FEATURE_TRACKER.md`; removal does not assert that legal review has happened. |
| Privacy | “distributed rate-limiting provider,” “configured store,” and “campaign or referral parameters.” | Plain-language explanations preserving the actual data-handling disclosures. |
| Privacy controls | Raw consent state “unknown.” | “No preference selected,” “Allowed,” or “Declined.” |
| Property filters | “Newest published” and internal 14-day expiry/sorting explanations. | “Newest listings” and concise guidance about matching details and confirming terms. |
| Empty states | “No dated estate updates have been published,” “no currently published estate listings,” and “off-site availability.” | Current-options and inspection guidance. |
| Seller page and FAQs | Publication workflow and “current media.” | Listing, photographs, enquiries, and ownership checks explained to owners. |
| Insights | “Useful before persuasive” and generic topic boilerplate. | Buyer-focused heading and topic-specific descriptions. |
| Gallery | “Estate image archive.” | “Estate gallery.” |
| Enquiry errors | “Invalid submission origin,” security configuration and delivery setup language. | Refresh/retry or direct-contact guidance. Internal diagnostic logs are retained. |
| Brand preview | Publicly accessible internal identity board with “Primary lockup,” palette hex codes, and document mockups. | Available in development only; production renders the not-found page. |

## Appropriate customer information retained

Property source labels distinguish developer sales from owner resales. Availability, estate-context photograph disclosures, prices, sizes, references, company identity, founder relationship, independent-operation disclosure, payment terms, and professional-advice guidance provide material transaction information.

Article publication dates and references to dated developer terms are editorial evidence, not internal publication instructions.

## Deployment status

The September 30 cleanup is present on the live site, as checked October 1. The changes below passed local verification; deployment has not been verified.

## October 1: personal matching and optional listings

Implemented on `main`, starting from `300e84b817f3c14adcf69a1e5bf455356cdea333`. Commit and push were authorized October 1; live database migrations remain pending.

- Homepage and Buying options explain developer plots and owner resales before any optional property showcase. Buyers can discuss their budget without choosing a listing.
- Approved headlines, seller labels, owner terminology, naira display, land-only clarification, and the two-section article title are updated. The resale invitation makes no stock or discount guarantee.
- The area guide owns the approved developer benchmark, its plot size, source confirmation date, and visibility. General price references no longer depend on a published listing. Listing asking prices remain separate.
- Property staff can feature posts, preview saved drafts through a protected shared renderer, and publish directly after verification. Existing media approvals, private documents, source labels, and withdrawal behavior remain in place.
- Additive migrations prepare audited database copy corrections and publishing changes. The benchmark migration preserves the source verification date; it does not claim a fresh stock check.

Verification: 110 unit tests; 104 browser/accessibility tests at 375, 768, 1024, and 1440 px; four production performance/metadata checks; production build, TypeScript, and ESLint passed. All 31 migrations applied in an isolated PostgreSQL 16 database with minimal Auth/Storage test schemas; 21 database assertions passed with fixtures rolled back. Zero-listing homepage/catalogue rendering and protected-preview structured-data exclusion are covered by tests.

The public buyer journey was also inspected in the in-app browser. No production enquiries were submitted. Authenticated admin UI save/publish and real Supabase Storage delivery have not been rerun against a complete local Supabase stack or the live service.

Next bounded action: apply the two October 1 migrations to the intended Supabase environment before deploying this application, then run the authenticated local publication check in `scripts/verify-local-property-publication.mjs` and reconfirm the approved benchmark in the area editor. Live database changes and explicit deployment actions require separate authorization.
