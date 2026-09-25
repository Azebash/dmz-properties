# ADR 0008: Route incoming leads to one configured property operator

- Status: Proposed
- Date: 2026-09-25
- Related: [ADR 0002](0002-staff-governance.md), [ADR 0007](0007-audited-lead-follow-ups.md)

## Context

DMZ Properties may initially be operated by one person. Public submissions
currently arrive unassigned, requiring an administrator to assign each enquiry
before its owner is apparent in the inbox. Inspection requests inherit enquiry
ownership only after a later assignment. The administrator role already allows
one operator to manage properties, content, staff, and lead workflows; intake
routing needs a single-operator path too.

## Decision

- An administrator may store one default lead owner in a protected,
  administrator-managed setting. The account must be active, confirmed, and an
  administrator or property manager. The setting is audited and private;
  clients cannot read or change it directly.
- If no explicit setting exists, intake auto-assigns new enquiries only when
  exactly one eligible property operator exists. If several exist, submissions
  remain unassigned until an administrator selects a default or manually assigns
  them. An invalid configured account fails closed rather than silently routing
  work to someone else.
- New inspection requests inherit the enquiry's owner. Seller submissions stay
  accessible to property staff through the linked enquiry.
- During setup, an administrator may assign existing **unassigned open** leads
  and their **unassigned linked inspections** to the selected owner. Existing
  assignments and closed leads are preserved; each reassignment is audited.
  An owner cannot be disabled or changed to a non-property role until the
  routing setting is handed off or cleared.
- This routes work; it does not send notifications or remove the human
  responsibility to monitor the inbox and contact buyers.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Leave every new lead unassigned | Adds repetitive triage in a one-person operation. |
| Hard-code the founder's Auth UUID | Couples deployments to one project and makes a handoff unsafe. |
| Assign to the first eligible staff row | Ownership would depend on query ordering. |
| Assign every lead to all operators | Duplicates ownership and weakens accountability. |

## Consequences And Verification

The administrator chooses a default when multiple operators are active; the
sole-operator case requires no setting. Enquiry and inspection assignments are
written in their creation transaction. Linked pgTAP covers access boundaries,
automatic and explicit routing, bulk handoff, audit records, and owner
protection. Production verification must confirm the staff control is visible
and use a synthetic intake submission with cleanup; never change ownership of
real leads as a test.

## Rollback

Clear the default owner in staff settings. New enquiries then auto-route only
when exactly one eligible operator exists; with multiple operators they remain
unassigned. Existing assignments are retained.
