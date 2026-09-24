# ADR 0003: Read approved property inventory from Supabase

- Status: Accepted
- Date: 2026-09-24
- Related: [ADR 0001](0001-supabase-operational-platform.md), [ADR 0002](0002-staff-governance.md)

## Context

Property managers and administrators already write audited Supabase property
records. The public catalogue, listing pages, area cards, sitemap, and buyer
enquiry validation continued reading `src/lib/content.ts`. The seeded published
record shares the current listing's slug, reference, price, and location, but
its original copy and verification date differed. Admin edits could not reach
buyers through that legacy read path.

## Decision

- `properties` is the owner of public inventory state when
  `SUPABASE_CONTENT_SOURCE=database`. Every public listing reader and
  property-specific enquiry validation uses only rows visible to the anonymous
  `published` policy. A database failure is an error, not a silent fallback.
- The repository record remains available only behind the explicit
  `SUPABASE_CONTENT_SOURCE=repository` rollback setting. Its photographs are
  presentation assets, not a second source of price, availability, or copy.
- An authorized administrator or property manager can make audited edits to
  a published listing immediately. Drafts still require review and publication.
  A slug and reference cannot change after first publication, preserving links
  and buyer enquiry context.
- The known 600 sqm developer land listing shows real **estate-context**
  photography, explicitly not a picture of an individual plot. Offer letters
  are private. Newly published records without curated, approved media show a
  visible media-pending placeholder, not an unrelated house photograph.
- Public prices with a numeric amount are formatted from `price_amount`, not
  from a potentially stale display label. The area page, FAQs, and buyer guide
  use the published developer listing for their current price. The originally
  seeded article's NGN 14m figure is explicitly dated to its publication,
  rather than described as a live price. Future articles remain editorial
  records subject to separate staff review.

Freeform descriptions and features remain authored copy: they cannot be proved
consistent with a structured price by a general text parser. Apart from the
known developer-price feature rendered from the amount, property staff must
review any monetary wording when they change a live price. That is an accepted
editorial responsibility of the authorized roles, not a claim that all prose
is automatically synchronized.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Keep public files while editing Supabase | Published status and price changes remain invisible to buyers. |
| Fall back automatically to file content on database errors | Could restore a withdrawn listing or stale price without warning. |
| Show generic estate homes as photos of any resale | Misrepresents an owner's specific property. |
| Delay every live edit until a second review | User chose immediate audited updates for staff roles authorized to manage properties. |

## Migration And Evidence

The seed-copy reconciliation updates only the untouched, matching developer
row and preserves its last-verified timestamp. Anonymous RLS and the property
publication RPC are tested against linked Supabase. Public adapters preserve
the existing slug and curated estate-context media, including an explicit
repository rollback. A reversible linked browser fixture tests draft privacy,
review, publication, immediate edits, media placeholder, sitemap and catalogue
appearance, and removal when reserved; fixture rows and audit events are deleted.

The database-mode production build, public property routes, buyer form,
staff-assignment workflow, and read-only listing/sitemap checks passed after
deployment. If production cutover fails later, set
`SUPABASE_CONTENT_SOURCE=repository` and
redeploy while keeping the Supabase records for correction. Business approvals
for current title particulars, complete fees, and resale-specific evidence
remain separate publication gates.
