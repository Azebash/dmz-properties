import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { business, estate } from "@/lib/business";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "KYC Homes Phase II Buyer Guide",
  description:
    "A printable buyer checklist covering price, inspections, developer applications, owner resales, payments, and documentation at KYC Homes Phase II.",
  alternates: { canonical: "/guides/kyc-homes-phase-ii-buyer-guide" },
};

const checklist = [
  "Confirm whether the property is direct developer inventory or an owner resale.",
  "Match the seller or developer to the relevant property records.",
  "Reconfirm the current price, availability, and complete payment schedule.",
  "Request the current title particulars and use independent legal advice.",
  "Inspect the property physically or through a live remote session.",
  "Confirm plot identity, size, access, and development position.",
  "Obtain all post-allocation charge amounts in writing.",
  "Verify payment instructions through an approved channel before transfer.",
  "Keep agreements, receipts, allocation records, and material correspondence.",
];

export default function BuyerGuidePage() {
  return (
    <main className="buyer-guide">
      <header className="section-shell page-hero buyer-guide-hero">
        <p className="eyebrow">Buyer guide / KYC Homes Phase II</p>
        <h1 className="page-title">A clearer route from interest to ownership.</h1>
        <p>
          A practical checklist for direct developer purchases and verified owner
          resales in Sabon Lugbe, Abuja.
        </p>
        <PrintButton />
      </header>

      <section className="section-shell guide-facts">
        <div>
          <span>Current developer land price</span>
          <strong>{estate.developerLandPrice}</strong>
        </div>
        <div>
          <span>Plot standard</span>
          <strong>{estate.plotSize}</strong>
        </div>
        <div>
          <span>Development format</span>
          <strong>{estate.propertyType}</strong>
        </div>
      </section>

      <section className="section-shell guide-section">
        <h2>Before you commit</h2>
        <ol className="buyer-checklist">
          {checklist.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-shell guide-columns">
        <article>
          <p className="eyebrow">Developer purchase</p>
          <h2>Direct company inventory</h2>
          <p>
            Apply through the approved process, await developer approval, confirm
            current terms, make the qualifying payment through verified channels,
            and track allocation through the client portal.
          </p>
          <TrackedLink
            href={estate.applicationUrl}
            eventName="official_application_click"
            eventData={{ placement: "buyer_guide" }}
            newTab
          >
            Official application portal
          </TrackedLink>
        </article>
        <article>
          <p className="eyebrow">Owner resale</p>
          <h2>Existing client property</h2>
          <p>
            The owner sets the asking price. Ownership, authority to sell,
            payment position, property identity, and the applicable estate
            transfer process must be confirmed before commitment.
          </p>
          <Link href="/sell">How DMZ reviews resales</Link>
        </article>
      </section>

      <section className="section-shell guide-contact">
        <div>
          <span>DMZ Properties</span>
          <strong>{business.phone.international}</strong>
        </div>
        <address>{business.address.display}</address>
        <Link className="button button-primary no-print" href="/contact">
          Discuss your requirements
        </Link>
      </section>
    </main>
  );
}
