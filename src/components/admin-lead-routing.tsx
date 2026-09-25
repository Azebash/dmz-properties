"use client";

import { useActionState } from "react";
import { setDefaultLeadOwnerAction, type StaffActionState } from "@/app/admin/(protected)/staff/actions";

const initialState: StaffActionState = { error: "", message: "" };

export function AdminLeadRouting({ staff, defaultOwner }: {
  staff: { user_id: string; display_name: string; role: string; active: boolean; auth_eligible: boolean }[];
  defaultOwner: string | null;
}) {
  const [state, action, pending] = useActionState(setDefaultLeadOwnerAction, initialState);
  const eligible = staff.filter((member) => member.active && member.auth_eligible &&
    (member.role === "administrator" || member.role === "property_manager"));
  return (
    <section className="admin-lead-routing" aria-labelledby="default-owner-heading">
      <form className="admin-editor" action={action}>
        <h2 id="default-owner-heading">One-person lead operations</h2>
        <p>Choose who receives new enquiries and inspection requests. If no owner is selected, the system automatically routes them only when there is exactly one eligible property operator.</p>
        <div className="field">
          <label htmlFor="default-lead-owner">Default lead owner</label>
          <select id="default-lead-owner" name="assignee" defaultValue={defaultOwner || ""}>
            <option value="">Automatic when there is one eligible operator</option>
            {eligible.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name} ({member.role.replaceAll("_", " ")})
              </option>
            ))}
          </select>
        </div>
        <label className="consent-field">
          <input type="checkbox" name="assignExisting" value="yes" />
          <span>Also assign existing unassigned open enquiries and their inspections to this person. Existing assignments will not change.</span>
        </label>
        <button className="button button-secondary" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save lead routing"}
        </button>
        {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
      </form>
    </section>
  );
}
