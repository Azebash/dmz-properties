"use client";

import { useActionState } from "react";
import { saveEnquiryFollowUp, type FollowUpActionState } from "@/app/admin/(protected)/enquiries/follow-up-actions";
import { followUpLabel, lagosToday } from "@/lib/admin/follow-ups";
import type { EnquiryStatus } from "@/lib/admin/lead-workflow";

const initialState: FollowUpActionState = { error: "", message: "" };

export function AdminEnquiryFollowUp({ id, status, followUpOn }: {
  id: string; status: EnquiryStatus; followUpOn: string | null;
}) {
  const [state, action, pending] = useActionState(saveEnquiryFollowUp, initialState);
  if (status === "won" || status === "lost" || status === "spam") {
    return <p className="admin-readonly-note">Closed enquiries have no pending follow-up. Reopen the lead before scheduling one.</p>;
  }
  const today = lagosToday();
  const max = new Date(Date.parse(`${today}T12:00:00Z`) + 366 * 86400000).toISOString().slice(0, 10);
  return (
    <form className="admin-workflow" action={action}>
      <h2>Next follow-up</h2>
      <p>Set a date for the assigned teammate to contact this lead. Due reminders appear in the staff inbox; no email is sent.</p>
      <p className="admin-follow-up" data-due={followUpOn && followUpOn < today ? "overdue" : "scheduled"}>
        {followUpLabel(followUpOn, today)}
      </p>
      <input type="hidden" name="enquiryId" value={id} />
      <div className="field">
        <label htmlFor={`follow-up-on-${id}`}>Follow up by (Abuja date)</label>
        <input key={`${id}-${followUpOn || "none"}`} id={`follow-up-on-${id}`}
          name="followUpOn" type="date" min={today} max={max}
          defaultValue={followUpOn || ""} required />
      </div>
      <div className="button-row">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save follow-up date"}
        </button>
        {followUpOn ? (
          <button className="button button-secondary" type="submit" name="clear" value="yes"
            formNoValidate disabled={pending}>Clear reminder</button>
        ) : null}
      </div>
      {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
      {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
    </form>
  );
}
