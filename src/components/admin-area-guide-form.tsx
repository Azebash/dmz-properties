"use client";

import { useActionState } from "react";
import { saveAreaGuideAction } from "@/app/admin/(protected)/areas/kyc-homes-phase-ii/actions";
import { areaGuideFields, type AreaGuideCopy } from "@/lib/area-guide-copy";

export function AdminAreaGuideForm({ copy }: { copy: AreaGuideCopy }) {
  const [state, action, pending] = useActionState(saveAreaGuideAction, { error: "" });
  return (
    <form action={action} className="admin-editor">
      <p>Update editorial wording and search metadata. Estate facts, prices, imagery, and application guidance remain tied to verified source data.</p>
      <div className="admin-form-grid">
        {areaGuideFields.map(({ key, label }) => (
          <div className="field field-full" key={key}>
            <label htmlFor={`area-${key}`}>{label}</label>
            {key.endsWith("Description") ? (
              <textarea id={`area-${key}`} name={key} minLength={10} maxLength={400} defaultValue={copy[key]} required />
            ) : (
              <input id={`area-${key}`} name={key} minLength={10} maxLength={400} defaultValue={copy[key]} required />
            )}
          </div>
        ))}
      </div>
      {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save as draft"}
      </button>
    </form>
  );
}
