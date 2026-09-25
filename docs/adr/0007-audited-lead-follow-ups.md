# ADR 0007: Track follow-up dates in the protected lead inbox

- Status: Proposed
- Date: 2026-09-25
- Related: [ADR 0001](0001-supabase-operational-platform.md), [ADR 0002](0002-staff-governance.md)

## Context

Leads already have audited stages, private notes, and staff ownership, but no
durable next-contact date. The inbox displays only recent enquiries, so an
older buyer due for a callback could disappear from view. Email notifications
are not configured, and scheduled GitHub monitoring cannot currently run.

## Decision

- A property manager or administrator can schedule or clear a date-only
  follow-up on an active enquiry through an audited database RPC. Dates are
  interpreted in Abuja (`Africa/Lagos`) time. Backdated and more-than-one-year
  dates are rejected. The `follow_up_on` column remains private under existing
  lead RLS; direct staff table writes remain forbidden. Repeated identical
  updates do not create extra audit events.
- Closing a lead as won, lost, or spam clears its reminder in the same audited
  workflow transaction. Reopening the lead does not restore an old date.
- The protected inbox shows due and overdue reminders separately from its
  latest-enquiries table, ordered by due date. The overview reports the full
  due count. If the inbox reaches its first 100 due rows, it says so rather
  than implying the list is complete. The lead detail page can reschedule or
  clear a reminder and shows its current state.
- This is an in-app staff queue, not an automated email, SMS, WhatsApp, or
  browser push notification. A human must still monitor and assign leads.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Notes-only reminders | Freeform text cannot reliably surface overdue work. |
| Browser-local reminder state | Other staff and sessions would miss the due date. |
| External calendar or email delivery | No verified inbox, domain, or notification credentials exist yet. |
| Clear reminders only in the UI | Another client could leave a closed lead overdue. |

## Consequences And Verification

Follow-ups are limited to a date rather than a time of day; staff use their
existing lead contact preference for timing. Linked pgTAP proves roles, date
limits, idempotency, audit events, terminal cleanup, and reopen behavior. A
reversible browser workflow with a synthetic lead must prove staff scheduling,
visibility in the due inbox, closure removal, and cleanup before calling
production rollout complete.

## Rollback

Remove scheduling controls and the due section while keeping audited dates
private in the database. Do not present a passive inbox as an active outbound
notification system.
