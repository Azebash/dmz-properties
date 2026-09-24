# ADR 0004: Keep uploaded property media private until approved

- Status: Accepted
- Date: 2026-09-24
- Related: [ADR 0001](0001-supabase-operational-platform.md), [ADR 0003](0003-published-property-read-model.md)

## Context

The existing public developer plot uses curated estate-context photographs.
There was no staff upload or review path for additional property photos.
Supabase Storage already has a private `property-media` bucket and
`property_media` records for classification, descriptions, captions and order.
An owner's virgin-land offer letter is a private document, not an image of a
plot or public gallery material.

## Decision

- Administrators and property managers upload JPEG, PNG or WebP images of at
  most 3 MB into private Storage. The server checks file signatures, fully
  decodes and re-encodes each image as WebP without source metadata, then an
  audited database RPC records alt text, caption, estate-context or exact-
  property classification, and sort order. New uploads begin `submitted`.
- Images for a land or plot listing must be marked estate context. A developed home
  may use approved photos of the exact property or clearly labelled estate
  context. The database locks the parent property while changing classification
  and checks this rule again if a developed home is reclassified as land.
  Existing violations cause migration failure for manual review. Approved
  video rows cannot enter the image-only gallery. The first approved image by
  display order becomes the cover.
- Publishing requires an explicit classification and rights confirmation by
  an authorized property role; approval and withdrawal are audited. Changing
  approved alt text, caption, or classification returns it to review. A pure
  order change retains approval. Withdrawal does not delete the private file.
- Anonymous metadata reads require both approved media and a published parent
  property. The public image route rechecks anonymous RLS on every request and
  only then streams the private image through the server. Responses are not
  cached and public `<Image>` uses `unoptimized`, so withdrawal cannot be
  bypassed by a stale image-optimizer copy. Unapproved preview requires a
  property-staff session.
- Approved uploads replace the static fallback gallery for that property.
  Until approval, the verified developer plot keeps its explicitly labelled
  estate-context photos; other listings keep the neutral media-pending image.
  Offer letters continue to belong in the separate private document workflow.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Public Storage bucket or permanent image URLs | Withdrawal cannot promptly revoke a cached public asset. |
| Signed URLs in cached public HTML | A withdrawn file remains available until the signed URL expires. |
| Publish an image immediately after upload | Classification, descriptive accessibility copy, and rights have not been reviewed. |
| Render every home photo as an exact-property photo | Estate-context images could misrepresent a virgin plot or owner resale. |

## Consequences And Verification

The image endpoint incurs a private Storage download for each request rather
than using long-lived CDN cache. The upload action is bounded at 3 MB, with a
3.5 MB multipart Server Action limit below the hosting payload limit. File
registration failure checks whether the database committed before retrying
Storage cleanup. If that check is unavailable or both cleanup attempts fail,
the private path is logged for administrator reconciliation; it never becomes
a public image without an approved row. The private file is preserved after
withdrawal for audit and optional later reapproval.

Linked pgTAP proves anonymous/viewer restrictions, virgin-land classification,
approval rights confirmation, ordering, withdrawal and audit events. A
two-transaction linked test proves property-type and media-classification edits
serialize in both orders. A reversible local
production-build check uploads a real estate-context WebP, confirms 404 before
approval and after withdrawal, checks public image bytes only while approved,
and removes the test file, metadata, and audit history. The same reversible
check passed against the deployed production site after the image route and
staff editor were released; readiness and the published listing also passed.

## Rollback

Reverting application media readers restores the existing curated context or
placeholder imagery. The bucket remains private, and staff can withdraw any
approved row through the audited RPC. Never expose offer-letter documents or
turn the bucket public as a rollback shortcut.
