import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty, properties } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";

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
    image: property.gallery,
    dateModified: property.updatedAt,
    identifier: property.reference,
  };

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
          <div className="gallery-image" key={image}>
            <Image
              src={image}
              alt={`${property.title} view ${index + 1}`}
              fill
              priority={index === 0}
              sizes={index === 0 ? "(max-width: 800px) 100vw, 66vw" : "34vw"}
            />
          </div>
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
          <Link
            className="button button-primary"
            href={`/contact?property=${encodeURIComponent(property.reference)}&interest=${encodeURIComponent("Booking an inspection")}`}
          >
            Enquire about this property
          </Link>
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
    </main>
  );
}
