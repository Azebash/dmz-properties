import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty, properties } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { business, estate } from "@/lib/business";
import { PropertyActions } from "@/components/property-actions";
import { TrackedLink } from "@/components/tracked-link";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const property = getProperty((await params).slug);

  if (!property) return {};

  return {
    title: property.title,
    description: property.description,
    alternates: {
      canonical: `/properties/${property.slug}`,
    },
    openGraph: {
      title: property.title,
      description: property.description,
      images: [property.image],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const property = getProperty((await params).slug);

  if (!property) notFound();

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
            priceCurrency: "NGN",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingData) }}
      />
      <div className="section-shell">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Properties", href: "/properties" },
            { label: property.title },
          ]}
        />
      </div>
      <div className="section-shell property-gallery">
        {property.gallery.map((image, index) => (
          <figure className="gallery-image" key={image}>
            <Image
              src={image}
              alt={`KYC Homes Phase II estate context, view ${index + 1}`}
              fill
              preload={index === 0}
              sizes={index === 0 ? "(max-width: 800px) 100vw, 66vw" : "34vw"}
            />
            <figcaption>Estate context image</figcaption>
          </figure>
        ))}
      </div>
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
          <PropertyActions title={property.title} />
        </div>
      </section>
      <section className="section-shell detail-facts" aria-label="Property facts">
        <div className="detail-fact">
          <span>Availability</span>
          <strong>{property.status}</strong>
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
          <strong>{property.updatedAt}</strong>
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
      <aside className="section-shell property-source">
        <p>
          Product format and estate process cross-checked against {estate.developer}
          {` (${estate.developerRegistrationNumber})`}.
        </p>
        <a href={estate.developerProductUrl} target="_blank" rel="noreferrer">
          View official product information
        </a>
      </aside>
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
