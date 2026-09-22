import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/lib/content";
import { estate } from "@/lib/business";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Land and Properties in KYC Homes Phase II, Abuja",
  description:
    "Explore developer land, developed homes, and verified owner resales in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja.",
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
    name: estate.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sabon Lugbe, Airport Road",
      addressLocality: "Abuja",
      addressRegion: "Federal Capital Territory",
      addressCountry: "NG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: estate.coordinates.latitude,
      longitude: estate.coordinates.longitude,
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
              Explore land and properties in an established Abuja estate
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
          <strong>Documented process</strong>
          <p>Title particulars must be reviewed for each proposed transaction.</p>
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
              loading="eager"
              fetchPriority="high"
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
              alt="Ongoing detached residential construction at KYC Homes Phase II"
              fill
              sizes="(max-width: 800px) 100vw, 40vw"
            />
            <figcaption>Construction in progress</figcaption>
          </figure>
        </div>
        <Link className="button button-secondary section-action" href="/gallery">
          View full estate gallery
        </Link>
      </section>

      <section className="section-shell section-block estate-intro">
        <div className="estate-specification">
          <span>Current developer product</span>
          <strong>4-bedroom fully detached duplex</strong>
          <p>600 sqm virgin land / {estate.developerLandPrice}</p>
        </div>
        <h2>Two ways to own within the estate.</h2>
        <div className="estate-paths">
          <article>
            <span>Developer inventory</span>
            <h3>Purchase directly from available estate stock.</h3>
            <p>
              We explain current availability, approved terms, documentation,
              and the process from enquiry through allocation. Official Phase II
              applications are reviewed and approved by {estate.developer}.
            </p>
            <TrackedLink
              className="text-link section-action"
              href={estate.applicationUrl}
              eventName="official_application_click"
              eventData={{ placement: "estate_page" }}
              newTab
            >
              Official developer application
            </TrackedLink>
          </article>
          <article>
            <span>Owner resales</span>
            <h3>Acquire property from an existing KYC Homes client.</h3>
            <p>
              Every resale is reviewed for ownership, authority to sell, and the
              applicable transfer process before it is represented. Third-party
              resale prices are set by the individual owner and may differ from
              the developer&apos;s virgin-land price.
            </p>
            <Link className="text-link section-action" href="/sell">
              Sell within KYC Homes Phase II
            </Link>
          </article>
        </div>
      </section>

      <section className="estate-infrastructure">
        <div className="section-shell estate-infrastructure-grid">
          <div>
            <p className="eyebrow">Estate structure</p>
            <h2>Coordinated development standards.</h2>
          </div>
          <div className="infrastructure-list">
            <article>
              <strong>Cluster development</strong>
              <p>Coordinated building lines, setbacks, and residential standards.</p>
            </article>
            <article>
              <strong>Roads and utilities</strong>
              <p>Planned internal roads, street naming, drainage, and utility corridors.</p>
            </article>
            <article>
              <strong>Managed build stages</strong>
              <p>Developer-managed formwork, DPC, decking, and lintel milestones.</p>
            </article>
            <article>
              <strong>Digital client portal</strong>
              <p>Allocation, payment, documents, and build stages tracked online.</p>
            </article>
          </div>
        </div>
        <div className="section-shell source-note">
          <p>
            Developer information sourced from {estate.developer} ({estate.developerRegistrationNumber}).
          </p>
          <a href={estate.developerWebsite} target="_blank" rel="noreferrer">
            Visit the official developer website
          </a>
        </div>
      </section>

      <section className="estate-properties">
        <div className="section-shell section-block">
          <div className="section-heading">
            <h2>Current opportunities</h2>
            <p>
              Current developer inventory is shown below. Availability, price,
              payment terms, and documentation are reconfirmed before commitment.
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

      <section className="developer-journey">
        <div className="section-shell">
          <div className="section-heading">
            <h2>The official developer route</h2>
            <p>
              Direct company inventory follows KYC Interproject Limited&apos;s
              application and allocation process.
            </p>
          </div>
          <ol className="developer-journey-list">
            <li>
              <span>01</span>
              <strong>Apply</strong>
              <p>Submit buyer details, building category, and payment mode.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Developer approval</strong>
              <p>KYC management reviews the application for an allocation cycle.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Qualifying payment</strong>
              <p>Follow only the official approved payment instructions.</p>
            </li>
            <li>
              <span>04</span>
              <strong>Allocation and portal</strong>
              <p>Track the plot, payments, documents, and build stages online.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section-shell estate-location-card">
        <div>
          <p className="eyebrow">Location</p>
          <h2>Sabon Lugbe East Layout</h2>
          <p>Airport Road corridor, Abuja, Federal Capital Territory.</p>
        </div>
        <div className="location-coordinates">
          <span>8.951194, 7.396083</span>
          <a
            className="button button-secondary"
            href={estate.directionsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open directions
          </a>
        </div>
      </section>

      <section className="section-shell final-cta">
        <p>Buying or reselling within KYC Homes Phase II?</p>
        <h2>Speak with someone who knows the estate.</h2>
        <div className="final-cta-actions">
          <Link className="button button-primary" href="/contact">
            Make an enquiry
          </Link>
          <Link className="text-link" href="/guides/kyc-homes-phase-ii-buyer-guide">
            Read buyer guide
          </Link>
        </div>
      </section>
    </main>
  );
}
