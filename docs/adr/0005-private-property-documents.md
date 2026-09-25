# ADR 0005: Keep property verification documents in a separate staff-only workflow

- Status: Accepted
- Date: 2026-09-25
- Related: [ADR 0001](0001-supabase-operational-platform.md), [ADR 0004](0004-reviewed-property-media.md)

## Context

The operational schema has `property_documents`, but staff have no upload or
download workflow. Offer letters and title paperwork may contain private terms
and personal details. They cannot appear in the image gallery, public listing,
or buyer downloads merely because a photograph was approved. The existing
document metadata policy already restricts reads to administrators and property
managers; the document's bytes need an equally restrictive storage boundary.

## Decision

- Property managers and administrators upload PDF documents of at most 3 MB to
  a dedicated, private `property-documents` Storage bucket. A server action
  checks the size, declared MIME type, PDF header and trailer, then uploads
  under a generated path containing the property ID. Neither the original
  filename nor the raw path appears on a public page. PDF validation is a
  format check, not a claim that the legal content has been authenticated.
- An audited RPC registers a private record with a controlled type, internal
  name, optional notes, and `submitted` review state. Updates and state
  transitions are restricted to property roles in Postgres, regardless of UI
  visibility. Internally verifying requires an explicit inspection confirmation;
  changing verified details returns the record to review. Withdrawal preserves
  the private file and audit trail. None of these states confer public access.
- The staff-only download route checks the current session and the metadata
  policy on every request before fetching the private object. It sends a generic
  PDF filename as an attachment with no-store caching and `nosniff` rather than
  allowing browser inline rendering or a long-lived signed URL.
- If database registration returns an uncertain result, the server first checks
  for the row before cleaning up an orphan. An unavailable row lookup or failed
  cleanup is logged for staff reconciliation. Production checks use only
  synthetic PDFs and remove their private file, row, and temporary audit events.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Reuse the public photo gallery or image endpoint | Approval would risk publishing an offer letter. |
| Store PDFs in the seller-submission bucket | Different ownership and document lifecycle would be conflated. |
| Hand out signed Storage URLs | A link could outlive a staff-role change or withdrawal. |
| Delete withdrawn documents immediately | Removes review history and risks destroying evidence. |

## Consequences And Verification

The private bucket adds a storage dependency, and authenticated downloads use a
server request per file. This workflow tracks internal review; sending documents
to buyers, owner uploads, legally verifying title, and document retention policy
remain separate decisions. Linked pgTAP checks role restrictions, private bucket,
state transitions, and audit entries. A reversible browser check confirms
anonymous denial, authorized staff PDF download, and that metadata does not
leak to the public listing. The linked database tests and production browser
check passed; the photo and published-listing regression checks also passed
after rollout.

## Rollback

Remove staff UI access and stop new document uploads. Keep the private bucket
and audited records intact for authorized reconciliation; never publish stored
files as a shortcut.
