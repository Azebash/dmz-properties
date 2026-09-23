"use client";

import { useActionState } from "react";
import {
  updateEnquiryAction,
  type EnquiryActionState,
} from "@/app/admin/(protected)/enquiries/actions";
import { enquiryNextStatuses, type EnquiryStatus } from "@/lib/admin/lead-workflow";

export function AdminEnquiryWorkflow({
  id,
  status,
  notes,
}: {
  id: string;
  status: EnquiryStatus;
  notes: string | null;
}) {
  const [result, action, pending] = useActionState<EnquiryActionState, FormData>(
    updateEnquiryAction,
    { error: "", message: "" },
  );

  return (
    <form className="admin-workflow" action={action}>
      <h2>Follow up</h2>
      <p>Change the lead stage and record private notes. Each change is audited.</p>
      <input type="hidden" name="enquiryId" value={id} />
      <div className="field">
        <label htmlFor="enquiry-status">Lead stage</label>
        <select key={status} id="enquiry-status" name="status" defaultValue={status}>
          <option value={status}>{status.replaceAll("_", " ")} (current)</option>
          {enquiryNextStatuses[status].map((next) => (
            <option key={next} value={next}>
              {next.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="enquiry-notes">Private follow-up notes</label>
        <textarea
          key={`${id}-${notes ?? ""}`}
          id="enquiry-notes"
          name="notes"
          maxLength={5000}
          defaultValue={notes ?? ""}
        />
      </div>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save follow-up"}
      </button>
      {result.error ? <p className="admin-auth-error" role="alert">{result.error}</p> : null}
      {result.message ? <p className="admin-success" role="status">{result.message}</p> : null}
    </form>
  );
}
