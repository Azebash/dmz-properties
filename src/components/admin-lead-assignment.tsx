"use client";

import { useActionState } from "react";
import { assignLeadAction } from "@/app/admin/(protected)/staff/actions";

export function AdminLeadAssignment({
  enquiryId, assignedTo, staff,
}: {
  enquiryId: string;
  assignedTo: string | null;
  staff: { user_id: string; display_name: string }[];
}) {
  const [state, action, pending] = useActionState(assignLeadAction, { error: "", message: "" });
  return (
    <form className="admin-workflow" action={action}>
      <h2>Staff ownership</h2>
      <p>Assign this enquiry and its linked inspection to an active property teammate.</p>
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <div className="field">
        <label htmlFor={`assignee-${enquiryId}`}>Assigned to</label>
        <select id={`assignee-${enquiryId}`} name="assignee" defaultValue={assignedTo || ""}>
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.user_id} value={member.user_id}>{member.display_name}</option>
          ))}
        </select>
      </div>
      <button className="button button-secondary" type="submit" disabled={pending}>
        {pending ? "Assigning..." : "Save assignment"}
      </button>
      {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
      {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
    </form>
  );
}
