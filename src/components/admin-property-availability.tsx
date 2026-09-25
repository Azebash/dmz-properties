"use client";

import { useActionState, useState } from "react";
import { updatePropertyAvailability, type AvailabilityActionState } from "@/app/admin/(protected)/properties/availability-actions";
import { effectiveAvailability, availabilityLabel, type AvailabilityStatus } from "@/lib/property-availability";
import type { PropertyRow } from "@/lib/supabase/types";

const initialState: AvailabilityActionState = { error: "", message: "" };

export function AdminPropertyAvailability({ property }: { property: PropertyRow }) {
  const [state, action, pending] = useActionState(updatePropertyAvailability, initialState);
  const [status, setStatus] = useState<AvailabilityStatus>(property.availability_status as AvailabilityStatus);
  const effective = effectiveAvailability(property.availability_status, property.availability_checked_at);
  return (
    <section className="admin-property-media" aria-labelledby="availability-heading">
      <h2 id="availability-heading">Inventory availability</h2>
      <p>Current public label: <strong>{availabilityLabel(effective.status, effective.checkedAt)}</strong>.
        Last recorded check: {property.availability_checked_at?.slice(0, 10) || "none"}.
        Confirmations expire after 14 days. Publication and an older property review do not prove current stock.</p>
      {property.status === "published" ? (
        <form className="admin-editor" action={action}>
          <input name="propertyId" type="hidden" value={property.id} />
          <div className="field">
            <label htmlFor="availability-status">Availability after checking with the developer or owner</label>
            <select id="availability-status" name="availability" value={status}
              onChange={(event) => setStatus(event.target.value as AvailabilityStatus)}>
              <option value="unconfirmed">Needs confirmation</option>
              <option value="available">Confirmed available</option>
              <option value="on_hold">On hold</option>
            </select>
          </div>
          {status !== "unconfirmed" ? (
            <label className="consent-field">
              <input type="checkbox" name="checked" value="confirmed" />
              <span>I checked this property&apos;s current inventory with the developer or owner today and confirm the selected status.</span>
            </label>
          ) : null}
          <button className="button button-secondary" type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save availability check"}
          </button>
          {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
          {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
        </form>
      ) : <p>Publish the listing before recording a current inventory check. Changing publication status clears previous availability confirmations.</p>}
    </section>
  );
}
