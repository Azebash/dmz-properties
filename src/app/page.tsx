import Image from "next/image";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/public-articles";
import { getPublishedProperties } from "@/lib/public-properties";
import { availabilityLabel } from "@/lib/property-availability";
import { business } from "@/lib/business";
import styles from "./home.module.css";

export const revalidate = 60;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default async function Home() {
  const [articles, properties] = await Promise.all([getPublishedArticles(), getPublishedProperties()]);
  const selection = properties.slice(0, 3);

  return (
    <main id="main-content" className={`${styles.home} homepage`}>
      <section className={`${styles.shell} ${styles.hero}`} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>KYC Homes, Abuja. Firsthand perspective.</p>
          <h1 id="home-title">Know what you<br />are buying.</h1>
          <p className={styles.intro}>Land first. All property types. Focused exclusively on KYC Homes, with clear information and personal guidance.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/properties">Explore properties <Arrow /></Link>
            <Link className={styles.inlineLink} href="/book-inspection">Book an inspection <Arrow /></Link>
          </div>
        </div>
        <div className={`${styles.heroMedia} hero-media`}>
          <Image src="/images/estate/estate-hero.webp" alt="Completed residences within KYC Homes Phase II in Abuja, shown as estate context" fill preload sizes="(max-width: 767px) 100vw, 55vw" />
        </div>
      </section>

      <div className={`${styles.shell} ${styles.locationBar}`}>
        <div><span className={styles.smallLabel}>Our current focus</span><Link href="/areas/kyc-homes-phase-ii">KYC Homes Phase II <Arrow /></Link></div>
        <p>Sabon Lugbe, Airport Road, Abuja</p>
        <Link className={styles.inlineLink} href="/gallery">See the estate <Arrow /></Link>
      </div>

      <section className={`${styles.shell} ${styles.section}`} aria-labelledby="selection-title">
        <div className={styles.sectionHeading}>
          <h2 id="selection-title">A place to start.<br /><span className={styles.muted}>The facts to go further.</span></h2>
          <p>Land is our main offering. We also handle homes and other property types within KYC Homes, through developer inventory and owner resales.</p>
        </div>
        <div className={styles.selection}>
          {selection.map((property) => {
            const contextOnly = property.imageLabel === "Estate context" || property.imageLabel === "Images pending";
            return (
              <article key={property.slug} className={styles.propertyFeature}>
                {contextOnly ? (
                  <div className={styles.propertyVisual}>
                    <span className={styles.smallLabel}>{property.type} / {property.location}</span>
                    <p className={styles.propertySize}>{property.plotSizeSqm ? <>{property.plotSizeSqm}<span>sqm</span></> : property.size}</p>
                    <p className={styles.visualNote}>{property.imageLabel === "Images pending" ? "Property photography is pending verification." : "Estate photography shows the surroundings, not this specific property."}</p>
                  </div>
                ) : (
                  <div className={styles.propertyPhoto}>
                    <Image src={property.image} alt={property.media?.[0]?.alt || `${property.title} in ${property.location}`} fill unoptimized={property.image.startsWith("/api/property-media/")} sizes="(max-width: 767px) 100vw, 48vw" />
                  </div>
                )}
                <div className={styles.propertyDetails}>
                  <div className={styles.propertyTopline}><span>{property.status}</span><span>{property.reference}</span></div>
                  <h3><Link href={`/properties/${property.slug}`}>{property.title}</Link></h3>
                  <p className={styles.propertyLocation}>{property.location}</p>
                  <p className={styles.price}>{property.price}</p>
                  <p className={styles.availability}>{availabilityLabel(property.availabilityStatus, property.availabilityCheckedAt)}</p>
                  <dl className={styles.propertyFacts}>
                    <div><dt>Property type</dt><dd>{property.type}</dd></div>
                    <div><dt>Size</dt><dd>{property.size}</dd></div>
                    <div><dt>Source</dt><dd>{property.ownership}</dd></div>
                  </dl>
                  <p className={styles.purchaseNote}>Confirm current price, availability, and transaction terms with DMZ before committing.</p>
                  <div className={styles.actions}>
                    <Link className={styles.darkButton} href={`/properties/${property.slug}`}>View property <Arrow /></Link>
                    <Link className={styles.inlineLink} href={`/book-inspection?property=${encodeURIComponent(property.reference)}`}>Book an inspection <Arrow /></Link>
                  </div>
                </div>
              </article>
            );
          })}
          {!selection.length ? (
            <div className={styles.emptyState}>
              <h3>Your search starts with a conversation.</h3>
              <p>There are no published listings right now. Speak with DMZ about current availability and your requirements.</p>
              <Link className={styles.darkButton} href="/contact">Make an enquiry <Arrow /></Link>
            </div>
          ) : null}
        </div>
        {properties.length > 3 ? <Link className={`${styles.inlineLink} ${styles.moreLink}`} href="/properties">Explore properties <Arrow /></Link> : null}
      </section>

      <section className={`${styles.shell} ${styles.estateSection}`} aria-labelledby="estate-title">
        <div className={styles.estateMainImage}>
          <Image src="/images/estate/completed-home-03.webp" alt="Established residential homes within KYC Homes Phase II" fill sizes="(max-width: 767px) 100vw, 60vw" />
        </div>
        <div className={styles.estateCopy}>
          <p className={styles.eyebrow}>Local knowledge, closer to the ground</p>
          <h2 id="estate-title">Understand the place.<br />Then choose your property.</h2>
          <p>Completed homes, active construction, and different purchase routes. See KYC Homes Phase II as it is, with guidance from people who know it firsthand.</p>
          <Link className={styles.inlineLink} href="/areas/kyc-homes-phase-ii">Explore the area guide <Arrow /></Link>
          <div className={styles.estateDetailImage}>
            <Image src="/images/estate/development-progress-01.webp" alt="Residential construction in progress within KYC Homes Phase II" fill sizes="(max-width: 767px) 100vw, 35vw" />
          </div>
          <p className={styles.imageCaption}>Real estate context, including development in progress.</p>
        </div>
      </section>

      <section className={`${styles.shell} ${styles.section} ${styles.processSection}`} aria-labelledby="process-title">
        <div className={styles.sectionHeading}>
          <h2 id="process-title">Clarity at every step.</h2>
          <p>From your first question to a considered decision, DMZ is your point of contact.</p>
        </div>
        <ol className={styles.process}>
          <li><span className={styles.stepNumber}>01</span><h3>Tell us what matters.</h3><p>Share your budget, preferred property type, and timeline. We help you identify a relevant starting point.</p><Link className={styles.inlineLink} href="/contact">Make an enquiry <Arrow /></Link></li>
          <li><span className={styles.stepNumber}>02</span><h3>See it for yourself.</h3><p>Visit in person or arrange a live video inspection. Ask questions about the property, access, and surroundings.</p><Link className={styles.inlineLink} href="/book-inspection">Book an inspection <Arrow /></Link></li>
          <li><span className={styles.stepNumber}>03</span><h3>Check before committing.</h3><p>Understand the ownership records, transaction route, charges, and payment instructions before making a decision.</p><Link className={styles.inlineLink} href="/verification">How verification works <Arrow /></Link></li>
        </ol>
        <div className={styles.remoteNote}><p>Buying from abroad? You can still take a closer look.</p><Link className={styles.inlineLink} href="/buying-from-abroad">Explore remote buying <Arrow /></Link></div>
      </section>

      {articles.length ? (
        <section className={`${styles.shell} ${styles.insightsSection}`} aria-labelledby="insights-title">
          <div className={styles.insightsHeading}><h2 id="insights-title">A little knowledge.<br />A better decision.</h2><Link className={styles.inlineLink} href="/insights">All insights <Arrow /></Link></div>
          <div className={styles.insights}>
            {articles.slice(0, 3).map((article) => (
              <article className={styles.insight} key={article.slug}>
                <div className={styles.articleMeta}><span>{article.category}</span><span>{article.readTime}</span></div>
                <h3><Link href={`/insights/${article.slug}`}>{article.title}</Link></h3>
                <p>{article.excerpt}</p>
                <Link className={styles.articleLink} href={`/insights/${article.slug}`} aria-label={`Read ${article.title}`}>Read article <Arrow /></Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${styles.shell} ${styles.contactSection}`} aria-labelledby="contact-title">
        <div><p className={styles.smallLabel}>Property, properly considered.</p><h2 id="contact-title">Your next step<br />starts here.</h2><p>Ask a question. Discuss a property. Arrange a visit.</p></div>
        <div className={styles.contactActions}><Link className={styles.primaryButton} href="/contact">Make an enquiry <Arrow /></Link><a className={styles.phoneLink} href={business.phone.href}>{business.phone.international} <Arrow /></a><span>Speak directly with DMZ Properties</span></div>
      </section>
    </main>
  );
}
