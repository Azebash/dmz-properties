"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  uploadPropertyImage, updatePropertyImage, transitionPropertyImage,
  type MediaActionState,
} from "@/app/admin/(protected)/properties/media-actions";
import type { PropertyMediaRow } from "@/lib/supabase/types";
import { isVirginLandType } from "@/lib/admin/property-media-validation";

const initialState: MediaActionState = { error: "", message: "" };

function Classification({ estateContext, land, id }: {
  estateContext: boolean; land: boolean; id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={`classification-${id}`}>What does the photo show?</label>
      <select id={`classification-${id}`} name="classification"
        defaultValue={estateContext ? "estate_context" : "property_photo"}>
        <option value="estate_context">Estate context — not this specific property</option>
        {!land ? <option value="property_photo">This exact property</option> : null}
      </select>
    </div>
  );
}

function ImageRecord({ image, land }: { image: PropertyMediaRow; land: boolean }) {
  const [edit, editAction, editPending] = useActionState(updatePropertyImage, initialState);
  const [transition, transitionAction, transitionPending] = useActionState(transitionPropertyImage, initialState);
  const steps = image.verification_status === "submitted" ? ["approved", "rejected"]
    : image.verification_status === "approved" ? ["withdrawn"]
      : image.verification_status === "rejected" || image.verification_status === "withdrawn"
        ? ["submitted"] : [];
  return (
    <article className="admin-media-record">
      <div className="admin-media-thumb">
        <Image src={`/admin/property-media/${image.id}`} alt={image.alt_text}
          width={320} height={210} unoptimized />
      </div>
      <div>
        <p className="admin-status" data-status={image.verification_status}>
          {image.verification_status.replaceAll("_", " ")}
        </p>
        <form className="admin-editor admin-media-edit" action={editAction}>
          <h3>Image details</h3>
          <input type="hidden" name="mediaId" value={image.id} />
          <div className="admin-form-grid">
            <div className="field field-full">
              <label htmlFor={`alt-${image.id}`}>Image description (alt text)</label>
              <input id={`alt-${image.id}`} name="altText" defaultValue={image.alt_text}
                minLength={12} maxLength={220} required />
            </div>
            <div className="field field-full">
              <label htmlFor={`caption-${image.id}`}>Caption (optional)</label>
              <input id={`caption-${image.id}`} name="caption"
                defaultValue={image.caption || ""} maxLength={300} />
            </div>
            <Classification estateContext={image.estate_context} land={land} id={image.id} />
            <div className="field">
              <label htmlFor={`order-${image.id}`}>Display order (0 is first)</label>
              <input id={`order-${image.id}`} name="sortOrder" type="number" min={0} max={10000}
                defaultValue={image.sort_order} required />
            </div>
          </div>
          <button className="button button-secondary" type="submit" disabled={editPending}>
            {editPending ? "Saving..." : "Save image details"}
          </button>
          {edit.error ? <p className="admin-auth-error" role="alert">{edit.error}</p> : null}
          {edit.message ? <p className="admin-success" role="status">{edit.message}</p> : null}
        </form>
        {steps.length ? (
          <form className="admin-media-transitions" action={transitionAction}>
            <input type="hidden" name="mediaId" value={image.id} />
            {steps.includes("approved") ? (
              <label className="consent-field">
                <input type="checkbox" name="rightsConfirmed" value="confirmed" />
                <span>I confirm publication rights and that this classification accurately describes the photo.</span>
              </label>
            ) : null}
            <div className="button-row admin-content-actions">
              {steps.map((status) => (
                <button key={status} className="button button-secondary" type="submit"
                  name="status" value={status} disabled={transitionPending}>
                  {status === "approved" ? "Approve for public view" : status === "submitted"
                    ? "Send for review" : status === "withdrawn" ? "Withdraw image" : "Reject image"}
                </button>
              ))}
            </div>
            {transition.error ? <p className="admin-auth-error" role="alert">{transition.error}</p> : null}
            {transition.message ? <p className="admin-success" role="status">{transition.message}</p> : null}
          </form>
        ) : null}
      </div>
    </article>
  );
}

export function AdminPropertyMedia({
  propertyId, propertyType, images,
}: {
  propertyId: string;
  propertyType: string;
  images: PropertyMediaRow[];
}) {
  const [state, action, pending] = useActionState(uploadPropertyImage, initialState);
  const land = isVirginLandType(propertyType);
  return (
    <section className="admin-property-media" aria-labelledby="property-media-heading">
      <h2 id="property-media-heading">Property photos</h2>
      <p>Upload photos privately. Choose whether each image shows the estate or the exact property.
        Approved images appear publicly in display order; the first becomes the cover.
        Virgin land may use estate-context photos only. Offer letters belong in private documentation.</p>
      <form action={action} className="admin-editor">
        <h3>Add a photo</h3>
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="admin-form-grid">
          <div className="field field-full">
            <label htmlFor="new-property-image">JPEG, PNG or WebP image (maximum 3 MB)</label>
            <input id="new-property-image" name="image" type="file"
              accept="image/jpeg,image/png,image/webp" required />
          </div>
          <div className="field field-full">
            <label htmlFor="new-image-alt">Image description (alt text)</label>
            <input id="new-image-alt" name="altText" minLength={12} maxLength={220} required />
          </div>
          <div className="field field-full">
            <label htmlFor="new-image-caption">Caption (optional)</label>
            <input id="new-image-caption" name="caption" maxLength={300} />
          </div>
          <Classification estateContext land={land} id="new" />
        </div>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Uploading..." : "Upload for review"}
        </button>
        {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
      </form>
      {images.length ? (
        <div className="admin-media-list">
          {images.map((image) => <ImageRecord key={image.id} image={image} land={land} />)}
        </div>
      ) : <p>No uploaded photos yet. Approved estate-context imagery remains in use for the current developer plot.</p>}
    </section>
  );
}
