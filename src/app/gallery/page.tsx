import type { Metadata } from "next";
import { EstateGallery } from "@/components/estate-gallery";

export const metadata: Metadata = {
  title: "KYC Homes Phase II Gallery",
  description:
    "View genuine photographs of completed residences, active construction, and interiors at KYC Homes Phase II in Sabon Lugbe, Abuja.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <main>
      <section className="section-shell page-hero gallery-page-hero">
        <p className="eyebrow">Estate image archive</p>
        <h1 className="page-title">Development you can see.</h1>
        <p>
          Genuine views of completed homes, ongoing construction, and residential
          details within KYC Homes Phase II.
        </p>
      </section>
      <section className="section-shell gallery-page-content">
        <EstateGallery />
      </section>
    </main>
  );
}
