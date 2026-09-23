import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/lib/content";
import { getPublishedArticles } from "@/lib/public-articles";

export const revalidate = 60;

export default async function Home() {
  const articles = await getPublishedArticles();
  return (
    <main>
      <section className="hero section-shell">
        <div className="hero-copy">
          <p className="eyebrow">Property, properly considered</p>
          <h1>Know what you are buying.</h1>
          <p className="hero-intro">
            Verified property opportunities, clear information, and firsthand
            guidance for confident decisions.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/properties">
              Explore properties
            </Link>
            <Link className="text-link" href="/about">
              Why DMZ Properties
            </Link>
          </div>
        </div>

        <div className="hero-media">
          <Image
            src="/images/estate/estate-hero.webp"
            alt="Completed residences within KYC Homes Phase II in Abuja"
            fill
            preload
            unoptimized
            sizes="(max-width: 800px) 100vw, 56vw"
          />
          <Link className="hero-note" href="/areas/kyc-homes-phase-ii">
            <span>Current focus</span>
            <strong>KYC Homes Phase II</strong>
            <p>Sabon Lugbe, Airport Road, Abuja.</p>
          </Link>
        </div>
      </section>

      <section className="proof-strip section-shell" aria-label="Our approach">
        <p>Firsthand estate knowledge</p>
        <p>Verified ownership records</p>
        <p>Direct inspection support</p>
      </section>

      <section className="section-shell section-block">
        <div className="section-heading">
          <h2>A considered selection</h2>
          <p>
            We list properties we can investigate, explain, and stand behind.
            No open submissions and no anonymous listings.
          </p>
        </div>
        <div className="property-grid">
          {properties.slice(0, 3).map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </div>
        <Link className="button button-secondary section-action" href="/properties">
          View all properties
        </Link>
      </section>

      <section className="expertise-section">
        <div className="section-shell expertise-grid">
          <div className="expertise-image">
            <Image
              src="/images/estate/development-progress-01.webp"
              alt="Ongoing residential construction at KYC Homes Phase II"
              fill
              sizes="(max-width: 800px) 100vw, 45vw"
            />
          </div>
          <div className="expertise-copy">
            <p className="eyebrow">Our starting advantage</p>
            <h2>Close enough to know the difference.</h2>
            <p>
              DMZ Properties begins with specialist knowledge of KYC Homes Phase II,
              offering both developer inventory and verified client-owned
              resales. Our scope will grow, but our standard will not change.
            </p>
            <Link className="text-link light-link" href="/about">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell section-block insight-section">
        <div className="insight-heading">
          <h2>Property intelligence, without the noise.</h2>
          <Link className="text-link" href="/insights">
            All insights
          </Link>
        </div>
        <div className="article-list">
          {articles.map((article) => (
            <article key={article.slug} className="article-row">
              <p>{article.category}</p>
              <h3>
                <Link href={`/insights/${article.slug}`}>{article.title}</Link>
              </h3>
              <span>{article.readTime}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell final-cta">
        <p>Looking for property within KYC Homes Phase II?</p>
        <h2>Start with a clear conversation.</h2>
        <Link className="button button-primary" href="/contact">
          Make an enquiry
        </Link>
      </section>
    </main>
  );
}
