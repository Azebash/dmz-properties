import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { estateUpdateCategory, properties } from "@/lib/content";
import { estate } from "@/lib/business";
import { getPublicAreaGuide } from "@/lib/public-area-guide";
import { getPublishedArticles } from "@/lib/public-articles";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPublicAreaGuide();
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    alternates: { canonical: "/areas/kyc-homes-phase-ii" },
  };
}

export default async function KycEstatePage() {
  const [copy, articles] = await Promise.all([getPublicAreaGuide(), getPublishedArticles()]);
  const updates = articles.filter((article) => article.category === estateUpdateCategory).slice(0, 3);
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
            <h1>{copy.heroTitle}</h1>
          </div>
          <div className="estate-hero-copy">
            <p>{copy.heroDescription}</p>
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
            <h2>{copy.galleryTitle}</h2>
          </div>
          <p>{copy.galleryDescription}</p>
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
        <h2>{copy.pathsTitle}</h2>
        <div className="estate-paths">
          <article>
            <span>Developer inventory</span>
            <h3>Find your plot with DMZ.</h3>
            <p>
              We help you review current options, inspect the estate, and
              understand approved terms. {estate.developer} reviews and approves
              applications; DMZ remains your point of contact for acquisition guidance.
            </p>
            <Link className="text-link section-action" href="/properties">
              Explore DMZ inventory
            </Link>
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
            <Link className="text-link section-action" href="/contact">
              Ask DMZ about resales
            </Link>
          </article>
        </div>
      </section>

      <section className="estate-infrastructure">
        <div className="section-shell estate-infrastructure-grid">
          <div>
            <p className="eyebrow">Estate structure</p>
            <h2>{copy.infrastructureTitle}</h2>
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
              <strong>Inspection support</strong>
              <p>DMZ can coordinate an on-site visit or a live remote walkthrough before you decide.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-shell section-block estate-updates" aria-labelledby="estate-updates-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Estate updates</p>
            <h2 id="estate-updates-title">What has changed on the ground.</h2>
          </div>
          <p>Reviewed, dated updates from DMZ Properties. Confirm current site conditions through an inspection before deciding.</p>
        </div>
        {updates.length ? (
          <>
            <div className="article-list">
              {updates.map((update) => (
                <article className="article-row" key={update.slug}>
                  <p><time dateTime={update.publishedAt}>{update.publishedAt}</time></p>
                  <h3><Link href={`/insights/${update.slug}`}>{update.title}</Link></h3>
                  <span>{update.readTime}</span>
                </article>
              ))}
            </div>
            <Link className="button button-secondary section-action" href="/insights/topics/estate-update">
              View all estate updates
            </Link>
          </>
        ) : (
          <div className="estate-updates-empty">
            <p>No dated estate updates have been published yet. Ask DMZ for current site information and an inspection.</p>
            <Link className="text-link" href="/book-inspection">Request an inspection</Link>
          </div>
        )}
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
          <h2>{copy.processTitle}</h2>
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
            <h2>Your purchase, guided by DMZ</h2>
            <p>
              Start with DMZ for availability, inspections, and purchase guidance.
              {` ${estate.developer}`} handles formal application approval and allocation.
            </p>
          </div>
          <ol className="developer-journey-list">
            <li>
              <span>01</span>
              <strong>Speak with DMZ</strong>
              <p>Tell us what you need so we can explain current options and arrange an inspection.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Application review</strong>
              <p>We guide your preparation; KYC management reviews the formal application.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Confirm terms</strong>
              <p>Review the approved costs and pay only through confirmed transaction channels.</p>
            </li>
            <li>
              <span>04</span>
              <strong>Allocation</strong>
              <p>The developer confirms allocation; DMZ stays available to explain the process.</p>
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
          <Link className="button button-secondary" href="/book-inspection">
            Book an inspection
          </Link>
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
