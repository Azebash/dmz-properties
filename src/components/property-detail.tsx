import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { business } from "@/lib/business";
import { PropertyActions } from "@/components/property-actions";
import { TrackedLink } from "@/components/tracked-link";
import { serializeStructuredData } from "@/lib/structured-data";
import { availabilityLabel } from "@/lib/property-availability";
import type { Property } from "@/lib/content";
import type { DeveloperPrice } from "@/lib/area-guide-copy";
import { DeveloperPriceEnquiry } from "@/components/buying-options";

export function PropertyDetail({ property, preview = false, developerPrice = null }: {
  property: Property; preview?: boolean; developerPrice?: DeveloperPrice | null;
}) {
  const listingData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: `${siteUrl}/properties/${property.slug}`,
    dateModified: property.updatedAt,
    identifier: property.reference,
    ...(property.priceAmount
      ? {
          offers: {
            "@type": "Offer",
            price: property.priceAmount,
            priceCurrency: property.currency || "NGN",
            url: `${siteUrl}/properties/${property.slug}`,
          },
        }
      : {}),
  };
  const whatsappUrl = `${business.phone.whatsapp}?text=${encodeURIComponent(
    `Hello DMZ Properties, I am interested in ${property.title} (${property.reference}).`,
  )}`;

  return (
    <main className="detail-hero">
      {!preview ? <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(listingData) }}
      /> : null}
      <div className="section-shell">
        <Breadcrumbs
          structuredData={!preview}
          items={[
            { label: "Home", href: "/" },
            { label: "Properties", href: "/properties" },
            { label: property.title },
          ]}
        />
      </div>
      <div className={`section-shell property-gallery${property.gallery.length === 1 ? " property-gallery-single" : ""}`}>
        {property.gallery.map((image, index) => (
          <figure className="gallery-image" key={image}>
            <Image
              src={image}
              alt={property.media?.[index]?.alt || (property.imageLabel === "Estate context"
                ? `${property.location} estate context, not the specific property, view ${index + 1}`
                : property.imageLabel === "Images pending"
                  ? `Property media pending verification for ${property.title}`
                  : `${property.title}, view ${index + 1}`)}
              fill
              preload={index === 0 && property.imageLabel !== "Images pending"}
              unoptimized={image.startsWith("/api/property-media/") || image.startsWith("/admin/property-media/")}
              sizes={index === 0 ? "(max-width: 800px) 100vw, 66vw" : "34vw"}
            />
            <figcaption>{property.media?.[index]?.caption || (property.imageLabel === "Estate context"
              ? "Estate context, not the specific property" : property.imageLabel === "Images pending"
                ? "Property media pending" : "Property image")}</figcaption>
          </figure>
        ))}
      </div>
      {property.type === "Land" && property.imageLabel === "Estate context" ? (
        <p className="section-shell property-media-note">
          These photographs show the estate, not an individual virgin-land plot.
          Offer-letter details are reviewed privately during verification.
        </p>
      ) : null}
      {property.imageLabel === "Images pending" ? (
        <p className="section-shell property-media-note">
          Listing-specific photography has not been approved. Request verified property information before deciding.
        </p>
      ) : null}
      <section className="section-shell detail-header">
        <div>
          <p className="eyebrow">
            {property.type} / {property.location}
          </p>
          <h1>{property.title}</h1>
        </div>
        <div className="detail-summary">
          <strong className="detail-price">{property.price}</strong>
          <p>{property.description}</p>
          {property.reference === "DMZ-KYC-001" && property.source === "developer_inventory" ? <DeveloperPriceEnquiry price={developerPrice} reference={property.reference} /> : null}
          <div className="button-row detail-actions">
            <Link
              className="button button-primary"
              href={`/book-inspection?property=${encodeURIComponent(property.reference)}`}
            >
              Request an inspection
            </Link>
            <TrackedLink
              className="text-link"
              href={whatsappUrl}
              eventName="whatsapp_click"
              eventData={{ placement: "property", property_reference: property.reference }}
              newTab
            >
              Ask on WhatsApp
            </TrackedLink>
          </div>
          {!preview ? <PropertyActions title={property.title} /> : null}
        </div>
      </section>
      <section className="section-shell detail-facts" aria-label="Property facts">
        <div className="detail-fact">
          <span>Availability</span>
          <strong>{availabilityLabel(property.availabilityStatus, property.availabilityCheckedAt)}</strong>
        </div>
        <div className="detail-fact">
          <span>Ownership</span>
          <strong>{property.ownership}</strong>
        </div>
        <div className="detail-fact">
          <span>Size</span>
          <strong>{property.size}</strong>
        </div>
        <div className="detail-fact">
          <span>Reference</span>
          <strong>{property.reference}</strong>
        </div>
        <div className="detail-fact">
          <span>Last reviewed</span>
          <strong>{property.lastVerifiedAt || property.updatedAt}</strong>
        </div>
        <div className="detail-fact">
          <span>Inspection</span>
          <strong>Physical or remote</strong>
        </div>
      </section>
      <section className="section-shell property-features">
        <div>
          <p className="eyebrow">Property overview</p>
          <h2>What is currently confirmed.</h2>
        </div>
        <ul>
          {property.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      <section className="section-shell property-resources no-print">
        <h2>Prepare before you proceed</h2>
        <div>
          <Link href="/guides/kyc-homes-phase-ii-buyer-guide">Buyer checklist</Link>
          <Link href="/verification">Verification process</Link>
          <Link href="/buying-from-abroad">Buying from abroad</Link>
          <Link href="/payment-safety">Payment safety</Link>
        </div>
      </section>
    </main>
  );
}
