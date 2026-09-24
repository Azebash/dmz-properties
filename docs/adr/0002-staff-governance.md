# ADR 0002: Govern staff access and lead ownership through audited roles

- Status: Proposed
- Date: 2026-09-24
- Related: [ADR 0001](0001-supabase-operational-platform.md)

## Context

Supabase Auth already owns staff identity, while `staff_profiles` stores the active
role. Property, content, and lead mutations check those roles in database RPCs.
Staff accounts and assignments previously required out-of-band changes, leaving
no administrator-facing handoff or role-change history. Public property pages
still use repository listing data; that separate read migration needs a stable
staff authorization boundary first.

## Decision

- Supabase Auth owns individual sign-in credentials and invitations. It does
  not own application permissions.
- `staff_profiles` owns the four roles (`administrator`, `property_manager`,
  `content_editor`, `viewer`) and active access. Only an active administrator
  can create or change a profile using `manage_staff_profile`; direct client
  table writes remain denied.
- Buyer enquiries, inspections, seller submissions, and verification documents
  are readable only by administrators and property managers. Content editors
  and viewers may review non-private property and editorial records, but cannot
  see buyer or seller contact details.
- Administrators grant access to an existing, confirmed Supabase Auth user with
  an established password. Invitations remain a separate, unverified Auth
  workflow and cannot grant an active profile until onboarding is secured.
- Only administrators can assign or unassign an enquiry. The linked inspection
  receives the same owner in the same transaction. Only active administrators
  and property managers may own work.
- An administrator cannot remove their own access; active assigned work must
  be handed off before a staff member is disabled or loses a property role.
  An advisory transaction lock serializes role and assignment mutations.
- Profile creation, access changes, and work assignments record actor and
  before/after values in `audit_events`. Existing role-checked publication RPCs
  remain the only property and article writers.
- The effective role also requires a confirmed email, an established password,
  and an Auth user who is not banned. Linked lead assignment rejects blocked
  users, and the directory distinguishes blocked Auth accounts from active staff.
- Auth user deletion cannot cascade away a staff profile. Offboarding disables
  and audits the staff role; privileged account removal requires a separate,
  deliberate profile cleanup after assignments are handed off.

## Alternatives

| Approach | Reason not selected |
| --- | --- |
| Manage roles and assignments only in the Supabase dashboard | No bounded staff UI or audited operational handoff; broad manual database access. |
| Store roles in user-editable Auth metadata | Clients could influence permissions; conflicts with ADR 0001 and row-level authorization. |
| Write profiles with the service key from server actions | Bypasses actor-checked database policy and the single audited mutation path. |

## Consequences And Rollout

The administrator creates individual Auth accounts outside the app, then grants
roles in `/admin/staff`. Profile and assignment writes use the authenticated
actor's RPC, not the service key. The database rejects activating an Auth user
who lacks a confirmed email or password. Staff invitations need a pending
profile and audited password-completion gate before being added to the UI.

Apply the governance migration, verify anonymous/viewer/manager/admin RLS,
check a synthetic, already-provisioned Auth user's access and role changes,
then design a pending invitation path separately. Do not switch public property
reads until a listing's public media and approved copy are mapped and the
repository fallback has a defined exit gate.

## Verification And Rollback

Linked pgTAP proves authorization, self-lockout prevention, assignment handoff,
and auditing. Browser checks must cover viewer denial and administrator access;
synthetic Auth accounts and audit rows must be removed afterward. Disable the
staff invitation and assignment UI if Auth delivery fails; existing staff
sessions and database roles remain intact. Database policy remains the final
authorization boundary even if the UI is rolled back.
