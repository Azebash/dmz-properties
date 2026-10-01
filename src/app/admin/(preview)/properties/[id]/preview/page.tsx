import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PropertyDetail } from "@/components/property-detail";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { getAdminProperty, getAdminPropertyMedia } from "@/lib/admin/queries";
import { propertyFromRow } from "@/lib/public-properties";
import { getPublicAreaGuide } from "@/lib/public-area-guide";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff listing preview",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PropertyPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") redirect("/admin/access-denied");
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const [row, media, guide] = await Promise.all([getAdminProperty(id), getAdminPropertyMedia(id), getPublicAreaGuide()]);
  if (!row) notFound();
  const property = propertyFromRow(row, media.filter((image) => image.media_type === "image" && image.verification_status === "approved"), new Date(), true);
  property.media = property.media?.map((image) => ({ ...image, src: image.src.replace("/api/property-media/", "/admin/property-media/") }));
  if (property.media?.length) {
    property.gallery = property.media.map((image) => image.src);
    property.image = property.gallery[0];
  }
  return (
    <>
      <aside className="section-shell staff-property-preview" role="status">
        <strong>Staff preview · {row.status.replaceAll("_", " ")}</strong>
        <p>This is the saved version. Save changes in the editor before previewing them. Only approved photos are shown.</p>
        {row.status !== "published" ? <p>This listing is not publicly available.</p> : null}
        <p>Search title: {property.seoTitle || property.title}</p>
        <p>Search description: {property.seoDescription || property.description}</p>
        <Link href={`/admin/properties/${id}/edit`}>Return to listing editor</Link>
      </aside>
      <PropertyDetail property={property} developerPrice={guide.developerPrice} preview />
    </>
  );
}
