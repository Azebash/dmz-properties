"use client";

import { useActionState, useState } from "react";
import {
  updateInspectionAction,
  updateInspectionTimezoneAction,
  type InspectionActionState,
} from "@/app/admin/(protected)/inspections/actions";
import { inspectionNextStatuses, type InspectionStatus } from "@/lib/admin/lead-workflow";

type InspectionWorkflowProps = {
  id: string;
  status: InspectionStatus;
  timeZone: string;
};

export function AdminInspectionWorkflow({ id, status, timeZone }: InspectionWorkflowProps) {
  const [selected, setSelected] = useState<InspectionStatus | "">("");
  const [result, action, pending] = useActionState<InspectionActionState, FormData>(
    updateInspectionAction,
    { error: "", message: "" },
  );
  const [zoneResult, zoneAction, zonePending] = useActionState<InspectionActionState, FormData>(
    updateInspectionTimezoneAction,
    { error: "", message: "" },
  );

  return (
    <div className="admin-workflow-group">
      <form className="admin-workflow" action={zoneAction}>
        <h2>Appointment time zone</h2>
        <p>Confirm the buyer’s time zone using a recognized IANA identifier before scheduling.</p>
        <input type="hidden" name="inspectionId" value={id} />
        <div className="field">
          <label htmlFor="inspection-time-zone">Time zone</label>
          <input
            key={timeZone}
            id="inspection-time-zone"
            name="timeZone"
            defaultValue={timeZone}
            maxLength={100}
            required
            list="time-zone-suggestions"
          />
          <datalist id="time-zone-suggestions">
            <option value="Africa/Lagos" />
            <option value="Europe/London" />
            <option value="America/New_York" />
            <option value="Etc/UTC" />
          </datalist>
        </div>
        <button className="button button-secondary" type="submit" disabled={zonePending}>
          {zonePending ? "Saving..." : "Update time zone"}
        </button>
        {zoneResult.error ? <p className="admin-auth-error" role="alert">{zoneResult.error}</p> : null}
        {zoneResult.message ? <p className="admin-success" role="status">{zoneResult.message}</p> : null}
      </form>

      {inspectionNextStatuses[status].length ? (
        <form className="admin-workflow" action={action}>
          <h2>Inspection follow-up</h2>
          <p>An inspection is not confirmed until a future local date and time have been set.</p>
          <input type="hidden" name="inspectionId" value={id} />
          <div className="field">
            <label htmlFor="inspection-next-status">Next step</label>
            <select
              key={status}
              id="inspection-next-status"
              name="status"
              defaultValue=""
              required
              onChange={(event) => setSelected(event.target.value as InspectionStatus)}
            >
              <option value="" disabled>Select a next step</option>
              {inspectionNextStatuses[status].map((next) => (
                <option key={next} value={next}>{next.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>
          {selected === "confirmed" ? (
            <div className="field">
              <label htmlFor="inspection-scheduled-local">Appointment in {timeZone}</label>
              <input id="inspection-scheduled-local" name="scheduledLocal" type="datetime-local" required />
            </div>
          ) : null}
          {selected === "completed" ? (
            <div className="field">
              <label htmlFor="inspection-outcome">Private outcome notes</label>
              <textarea
                id="inspection-outcome"
                name="outcomeNotes"
                minLength={10}
                maxLength={5000}
                required
              />
            </div>
          ) : null}
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save inspection"}
          </button>
          {result.error ? <p className="admin-auth-error" role="alert">{result.error}</p> : null}
          {result.message ? <p className="admin-success" role="status">{result.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
