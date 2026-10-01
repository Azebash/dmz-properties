"use client";

import { useActionState } from "react";
import { saveAreaGuideAction } from "@/app/admin/(protected)/areas/kyc-homes-phase-ii/actions";
import { areaGuideFields, type AreaGuideCopy } from "@/lib/area-guide-copy";

export function AdminAreaGuideForm({ copy }: { copy: AreaGuideCopy }) {
  const [state, action, pending] = useActionState(saveAreaGuideAction, { error: "" });
  return (
    <form action={action} className="admin-editor">
      <p>Update the guide and the developer-price benchmark. Saving creates a draft; the public copy and price change only after publication.</p>
      <div className="admin-form-grid">
        <div className="field"><label htmlFor="developer-price">Developer land price (₦)</label>
          <input id="developer-price" name="developerPriceAmount" type="number" min="0.01" max="1000000000000" step="0.01" defaultValue={copy.developerPrice?.amount || ""} /></div>
        <div className="field"><label htmlFor="developer-size">Plot size (sqm)</label>
          <input id="developer-size" name="developerPlotSize" type="number" min="0.01" max="10000000" step="0.01" defaultValue={copy.developerPrice?.plotSizeSqm || ""} /></div>
        <div className="field"><label htmlFor="developer-date">Price confirmation date</label>
          <input id="developer-date" name="developerPriceDate" type="date" defaultValue={copy.developerPrice?.confirmedAt || ""} /></div>
        <label className="consent-field field-full"><input type="checkbox" name="developerPriceVisible" defaultChecked={copy.developerPrice?.visible || false} />
          <span>Show the developer-price benchmark publicly. Use the date the price was actually confirmed.</span></label>
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
