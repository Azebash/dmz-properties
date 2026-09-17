import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/lib/content";

export const metadata: Metadata = {
  title: "Land and Properties in KYC Homes Phase II, Abuja",
  description:
    "Explore titled land, developed homes, and verified owner resales in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja.",
  alternates: {
    canonical: "/areas/kyc-homes-phase-ii",
  },
};

export default function KycEstatePage() {
  const estateProperties = properties.filter(
    (property) => property.location === "KYC Homes Phase II",
  );

  const placeData = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: "KYC Homes Phase II",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sabon Lugbe, Airport Road",
      addressLocality: "Abuja",
      addressRegion: "Federal Capital Territory",
      addressCountry: "NG",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeData) }}
      />
      <section className="estate-hero">
        <div className="section-shell estate-hero-grid">
          <div>
            <p className="eyebrow">Sabon Lugbe / Airport Road / Abuja</p>
            <h1>KYC Homes Phase II, understood from within.</h1>
          </div>
          <div className="estate-hero-copy">
            <p>
              Explore titled land and properties in an established Abuja estate
              where hundreds have already developed and new development continues.
            </p>
            <Link className="button button-primary" href="/contact">
              Request current availability
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell estate-proof" aria-label="KYC Homes Phase II overview">
        <div>
          <span>01</span>
          <strong>Titled estate</strong>
          <p>Property documentation is central to every conversation.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Established development</strong>
          <p>Hundreds of owners have already developed within the estate.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Active growth</strong>
          <p>Numerous developments remain ongoing across the estate.</p>
        </div>
      </section>

      <section className="section-shell estate-gallery-section">
        <div className="estate-gallery-heading">
          <div>
            <p className="eyebrow">Inside the estate</p>
            <h2>Established homes. Active development.</h2>
          </div>
          <p>
            Genuine photography from KYC Homes Phase II showing completed
            residences alongside continuing construction across the estate.
          </p>
        </div>
        <div className="estate-gallery">
          <figure className="estate-gallery-feature">
            <Image
              src="/images/estate/estate-hero.webp"
              alt="Completed homes at KYC Homes Phase II"
              fill
              sizes="(max-width: 800px) 100vw, 60vw"
            />
            <figcaption>Completed residences</figcaption>
          </figure>
          <figure>
            <Image
              src="/images/estate/completed-home-02.webp"
              alt="A completed private home at KYC Homes Phase II"
              fill
              sizes="(max-width: 800px) 100vw, 40vw"
            />
            <figcaption>Established private homes</figcaption>
          </figure>
          <figure>
            <Image
              src="/images/estate/development-progress-01.webp"
              alt="Ongoing multi-unit residential construction at KYC Homes Phase II"
              fill
              sizes="(max-width: 800px) 100vw, 40vw"
            />
            <figcaption>Construction in progress</figcaption>
          </figure>
        </div>
      </section>

      <section className="section-shell section-block estate-intro">
        <h2>Two ways to own within the estate.</h2>
        <div className="estate-paths">
          <article>
            <span>Developer inventory</span>
            <h3>Purchase directly from available estate stock.</h3>
            <p>
              We explain current availability, approved terms, documentation,
              and the process from enquiry through allocation.
            </p>
          </article>
          <article>
            <span>Owner resales</span>
            <h3>Acquire property from an existing KYC Homes client.</h3>
            <p>
              Every resale is reviewed for ownership, authority to sell, and the
              applicable transfer process before it is represented.
            </p>
            <Link className="text-link section-action" href="/sell">
              Sell within KYC Homes Phase II
            </Link>
          </article>
        </div>
      </section>

      <section className="estate-properties">
        <div className="section-shell section-block">
          <div className="section-heading">
            <h2>Current opportunities</h2>
            <p>
              Representative listings are shown while live inventory details are
              being prepared for publication.
            </p>
          </div>
          <div className="property-grid">
            {estateProperties.map((property) => (
              <PropertyCard key={property.slug} property={property} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell estate-process">
        <div>
          <p className="eyebrow">How we help</p>
          <h2>Local knowledge without informal shortcuts.</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <p>Understand your intended use, budget, and timeline.</p>
          </li>
          <li>
            <span>02</span>
            <p>Present relevant developer or verified resale options.</p>
          </li>
          <li>
            <span>03</span>
            <p>Arrange a physical or live remote inspection.</p>
          </li>
          <li>
            <span>04</span>
            <p>Guide the documented purchase or transfer process.</p>
          </li>
        </ol>
      </section>

      <section className="section-shell final-cta">
        <p>Buying or reselling within KYC Homes Phase II?</p>
        <h2>Speak with someone who knows the estate.</h2>
        <Link className="button button-primary" href="/contact">
          Make an enquiry
        </Link>
      </section>
    </main>
  );
}
