import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminPropertyForm } from "@/components/admin-property-form";
import { AdminPropertyMedia } from "@/components/admin-property-media";
import { AdminStatus } from "@/components/admin-status";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminProperty, getAdminPropertyMedia } from "@/lib/admin/queries";
import { transitionPropertyAction } from "@/app/admin/(protected)/properties/actions";
import type { PropertyStatus } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Edit Property" };

const transitions: Record<PropertyStatus, PropertyStatus[]> = {
  draft: ["under_review", "archived"],
  under_review: ["draft", "published", "archived"],
  published: ["under_review", "reserved", "sold", "archived"],
  reserved: ["published", "sold", "archived"],
  sold: ["archived"],
  archived: [],
};

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; transition?: string }>;
};

export default async function EditPropertyPage({
  params,
  searchParams,
}: EditPropertyPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const [staff, property, images] = await Promise.all([
    requireStaff(), getAdminProperty(id), getAdminPropertyMedia(id),
  ]);
  if (!property) notFound();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    redirect("/admin/access-denied");
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-edit-header">
        <div>
          <p className="eyebrow">Inventory / {property.reference}</p>
          <h1>Edit property</h1>
        </div>
        <AdminStatus value={property.status} />
      </header>
      {property.published_at ? (
        <p className="admin-readonly-note">
          Authorized edits to this published listing appear publicly when saved.
          Its URL and reference stay fixed. Keep any price references in freeform
          descriptions consistent with the amount you enter. Dated articles may
          need a separate editorial update when the developer price changes.
        </p>
      ) : null}
      {query.saved === "1" ? (
        <p className="admin-success" role="status">Property details saved.</p>
      ) : null}
      {query.transition === "saved" ? (
        <p className="admin-success" role="status">Publication status updated.</p>
      ) : null}
      {query.transition === "failed" ? (
        <p className="admin-auth-error" role="alert">
          The requested status transition was not allowed. Confirm verification
          and the current workflow state.
        </p>
      ) : null}
      <AdminPropertyForm property={property} />
      <AdminPropertyMedia propertyId={property.id} propertyType={property.property_type} images={images} />

      <section className="admin-transitions">
        <h2>Publication workflow</h2>
        <p>Status changes are validated and written to the audit history.</p>
        <div>
          {transitions[property.status].map((status) => (
            <form key={status} action={transitionPropertyAction}>
              <input name="propertyId" type="hidden" value={property.id} />
              <input name="status" type="hidden" value={status} />
              <button className="button button-secondary" type="submit">
                Move to {status.replaceAll("_", " ")}
              </button>
            </form>
          ))}
          {!transitions[property.status].length ? (
            <span>No further transitions are available.</span>
          ) : null}
        </div>
      </section>
    </div>
  );
}
