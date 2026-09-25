"use client";

import { useActionState } from "react";
import {
  uploadPropertyDocument, updatePropertyDocument, transitionPropertyDocument,
  type DocumentActionState,
} from "@/app/admin/(protected)/properties/document-actions";
import type { PropertyDocumentRow } from "@/lib/supabase/types";

const initialState: DocumentActionState = { error: "", message: "" };
const types = [
  ["offer_letter", "Offer letter"],
  ["title_document", "Title document"],
  ["survey_plan", "Survey plan"],
  ["other", "Other private document"],
] as const;

function DocumentFields({ document }: { document?: PropertyDocumentRow }) {
  const id = document?.id || "new";
  return (
    <div className="admin-form-grid">
      <div className="field">
        <label htmlFor={`document-type-${id}`}>Document type</label>
        <select id={`document-type-${id}`} name="documentType" defaultValue={document?.document_type || "offer_letter"}>
          {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`document-name-${id}`}>Internal document name</label>
        <input id={`document-name-${id}`} name="displayName" defaultValue={document?.display_name || ""}
          minLength={5} maxLength={120} required />
      </div>
      <div className="field field-full">
        <label htmlFor={`document-notes-${id}`}>Private notes (optional)</label>
        <textarea id={`document-notes-${id}`} name="notes" defaultValue={document?.notes || ""}
          maxLength={500} rows={2} />
      </div>
    </div>
  );
}

function DocumentRecord({ document }: { document: PropertyDocumentRow }) {
  const [edit, editAction, editPending] = useActionState(updatePropertyDocument, initialState);
  const [transition, transitionAction, transitionPending] = useActionState(transitionPropertyDocument, initialState);
  const steps = document.verification_status === "submitted" ? ["approved", "rejected"]
    : document.verification_status === "approved" ? ["withdrawn"]
      : document.verification_status === "rejected" || document.verification_status === "withdrawn"
        ? ["submitted"] : [];
  return (
    <article className="admin-editor">
      <h3>{document.display_name}</h3>
      <p className="admin-status" data-status={document.verification_status}>
        {document.verification_status.replaceAll("_", " ")} — staff only
      </p>
      <p><a className="text-link" href={`/admin/property-documents/${document.id}`}>
        Download private PDF
      </a></p>
      <form action={editAction} className="admin-media-edit">
        <input type="hidden" name="documentId" value={document.id} />
        <DocumentFields document={document} />
        <button className="button button-secondary" type="submit" disabled={editPending}>
          {editPending ? "Saving..." : "Save document details"}
        </button>
        {edit.error ? <p className="admin-auth-error" role="alert">{edit.error}</p> : null}
        {edit.message ? <p className="admin-success" role="status">{edit.message}</p> : null}
      </form>
      {steps.length ? (
        <form className="admin-media-transitions" action={transitionAction}>
          <input type="hidden" name="documentId" value={document.id} />
          {steps.includes("approved") ? (
            <label className="consent-field">
              <input type="checkbox" name="reviewConfirmed" value="confirmed" />
              <span>I inspected this private document and confirm its type and description.</span>
            </label>
          ) : null}
          <div className="button-row admin-content-actions">
            {steps.map((status) => (
              <button key={status} className="button button-secondary" type="submit"
                name="status" value={status} disabled={transitionPending}>
                {status === "approved" ? "Mark internally verified" : status === "submitted"
                  ? "Return to review" : status === "withdrawn" ? "Withdraw document" : "Reject document"}
              </button>
            ))}
          </div>
          {transition.error ? <p className="admin-auth-error" role="alert">{transition.error}</p> : null}
          {transition.message ? <p className="admin-success" role="status">{transition.message}</p> : null}
        </form>
      ) : null}
    </article>
  );
}

export function AdminPropertyDocuments({ propertyId, documents }: {
  propertyId: string;
  documents: PropertyDocumentRow[];
}) {
  const [state, action, pending] = useActionState(uploadPropertyDocument, initialState);
  return (
    <section className="admin-property-media" aria-labelledby="property-documents-heading">
      <h2 id="property-documents-heading">Private property documents</h2>
      <p>Keep offer letters, title documents, and survey plans here, never in the photo gallery.
        Only property managers and administrators can download them. Internal verification does not publish or send a document to buyers.</p>
      <form action={action} className="admin-editor">
        <h3>Add a private document</h3>
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="field field-full">
          <label htmlFor="new-property-document">PDF document (maximum 3 MB)</label>
          <input id="new-property-document" name="document" type="file" accept="application/pdf,.pdf" required />
        </div>
        <DocumentFields />
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Uploading..." : "Upload privately"}
        </button>
        {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
      </form>
      {documents.length ? (
        <div className="admin-media-list">
          {documents.map((document) => <DocumentRecord key={document.id} document={document} />)}
        </div>
      ) : <p>No private documents uploaded for this property.</p>}
    </section>
  );
}
