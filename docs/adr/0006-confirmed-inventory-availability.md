# ADR 0006: Separate inventory availability from property publication

- Status: Accepted
- Date: 2026-09-25
- Related: [ADR 0003](0003-published-property-read-model.md), [ADR 0004](0004-reviewed-property-media.md)

## Context

The catalogue publishes confirmed property records, but publication is not
evidence that a particular plot remains for sale. The property detail page
incorrectly showed the listing source (developer inventory versus owner resale)
under the heading “Availability.” Buyers still need to reconfirm stock and
terms. The existing published developer listing has no independently supplied
live allocation count or availability confirmation.

## Decision

- Store availability separately as `unconfirmed`, `available`, or `on_hold`,
  with a server-issued check timestamp. Existing rows begin `unconfirmed`
  without a timestamp; neither publication nor the property's general
  `last_verified_at` creates an inventory confirmation.
- Only an administrator or property manager can record a confirmed state,
  through a role-checked and audited RPC. The staff member must attest to
  checking that property's current inventory with the owner or developer;
  no timestamp is accepted from the browser. Confirmations must be refreshed
  after 14 days. A stale confirmation renders and filters as “Availability to
  confirm” while the original record and audit remain intact. Every property
  publication transition clears a prior check, including a reservation being
  returned to publication.
- The catalogue can filter recent confirmations, on-hold records, and records
  needing confirmation. Cards and detail pages show the effective availability
  with the check date when fresh; the source label stays separate. Buyers are
  still told to reconfirm before payment. No existing business record is
  automatically marked available by this migration.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Treat every published property as available | Publication does not prove live stock. |
| Reuse `last_verified_at` | This verifies listing information, not today's allocation. |
| Permanent “available” toggle | An old check could make a stale offer look current. |
| Manually edit a check date | A browser-supplied date is not reliable audit evidence. |

## Consequences And Verification

Staff must periodically reconfirm availability. Expiry is calculated on public
reads rather than changing the stored row, so the original check and actor
remain auditable. Linked database tests cover authorization, confirmation,
server timestamps, revocation, and republication; unit tests cover the 14-day
boundary and public fallback. Production read-only checks confirmed that the
real developer plot remains unconfirmed, the public filter excludes it from
recently available listings, and the staff action rejects an available claim
without attestation. No business inventory claim was changed.

## Rollback

Disable the filter and staff controls, render “Availability to confirm,” and
retain the audited check records. Never interpret `published` as a replacement
availability signal.
