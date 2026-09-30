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

These corrections are local until committed and deployed. The audited production site still contains the original wording.
