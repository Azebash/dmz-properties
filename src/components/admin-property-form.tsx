"use client";

import { useActionState } from "react";
import type { PropertyRow } from "@/lib/supabase/types";
import {
  savePropertyAction,
  type PropertyActionState,
} from "@/app/admin/(protected)/properties/actions";

const initialState: PropertyActionState = { error: "" };

export function AdminPropertyForm({ property }: { property?: PropertyRow }) {
  const [state, action, pending] = useActionState(savePropertyAction, initialState);
  const features = Array.isArray(property?.features)
    ? property.features.filter((item): item is string => typeof item === "string").join("\n")
    : "";

  return (
    <form className="admin-editor" action={action}>
      <input name="id" type="hidden" value={property?.id || ""} />
      <div className="admin-form-grid">
        <div className="field">
          <label htmlFor="property-reference">Reference</label>
          <input id="property-reference" name="reference" defaultValue={property?.reference} readOnly={!!property?.published_at} required />
        </div>
        <div className="field">
          <label htmlFor="property-source">Source</label>
          <select id="property-source" name="source" defaultValue={property?.source || "developer_inventory"} required>
            <option value="developer_inventory">Developer inventory</option>
            <option value="owner_resale">Owner resale</option>
          </select>
        </div>
        <div className="field field-full">
          <label htmlFor="property-title">Title</label>
          <input id="property-title" name="title" defaultValue={property?.title} required />
        </div>
        <div className="field field-full">
          <label htmlFor="property-slug">URL slug</label>
          <input id="property-slug" name="slug" defaultValue={property?.slug} readOnly={!!property?.published_at} required />
        </div>
        <div className="field">
          <label htmlFor="property-type">Property type</label>
          <input id="property-type" name="propertyType" defaultValue={property?.property_type} required />
        </div>
        <div className="field">
          <label htmlFor="ownership-label">Ownership label</label>
          <input id="ownership-label" name="ownershipLabel" defaultValue={property?.ownership_label || ""} />
        </div>
        <div className="field">
          <label htmlFor="location-name">Location name</label>
          <input id="location-name" name="locationName" defaultValue={property?.location_name} required />
        </div>
        <div className="field">
          <label htmlFor="address">Address</label>
          <input id="address" name="address" defaultValue={property?.address || ""} />
        </div>
        <div className="field">
          <label htmlFor="latitude">Latitude</label>
          <input id="latitude" name="latitude" type="number" step="any" defaultValue={property?.latitude || ""} />
        </div>
        <div className="field">
          <label htmlFor="longitude">Longitude</label>
          <input id="longitude" name="longitude" type="number" step="any" defaultValue={property?.longitude || ""} />
        </div>
        <div className="field">
          <label htmlFor="price-amount">Price amount</label>
          <input id="price-amount" name="priceAmount" type="number" min="0" step="0.01" defaultValue={property?.price_amount || ""} />
        </div>
        <div className="field">
          <label htmlFor="price-currency">Currency</label>
          <input id="price-currency" name="priceCurrency" maxLength={3} defaultValue={property?.price_currency || "NGN"} />
        </div>
        <div className="field">
          <label htmlFor="price-label">Display price</label>
          <input id="price-label" name="priceLabel" defaultValue={property?.price_label || ""} />
        </div>
        <div className="field">
          <label htmlFor="plot-size">Plot size (sqm)</label>
          <input id="plot-size" name="plotSizeSqm" type="number" min="0" step="0.01" defaultValue={property?.plot_size_sqm || ""} />
        </div>
        <div className="field field-full">
          <label htmlFor="property-description">Description</label>
          <textarea id="property-description" name="description" defaultValue={property?.description} required />
        </div>
        <div className="field field-full">
          <label htmlFor="features">Features, one per line</label>
          <textarea id="features" name="features" defaultValue={features} />
        </div>
        <div className="field">
          <label htmlFor="last-verified">Last verified</label>
          <input id="last-verified" name="lastVerifiedAt" type="date" required={property?.status === "published"} defaultValue={property?.last_verified_at?.slice(0, 10) || ""} />
        </div>
        <div className="field field-full">
          <label htmlFor="seo-title">SEO title</label>
          <input id="seo-title" name="seoTitle" defaultValue={property?.seo_title || ""} />
        </div>
        <div className="field field-full">
          <label htmlFor="seo-description">SEO description</label>
          <textarea id="seo-description" name="seoDescription" defaultValue={property?.seo_description || ""} />
        </div>
      </div>
      {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Saving..." : property ? "Save property" : "Create draft"}
      </button>
    </form>
  );
}
