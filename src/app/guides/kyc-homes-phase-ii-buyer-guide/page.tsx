import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { business, estate } from "@/lib/business";
import { getPublishedProperty } from "@/lib/public-properties";
import { getPublicAreaGuide } from "@/lib/public-area-guide";
import { buyingEnquiry, formatPropertyPrice } from "@/lib/buying-options";

export const revalidate = 60;

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

export default async function BuyerGuidePage() {
  const [developerLand, guide] = await Promise.all([getPublishedProperty("600sqm-virgin-land-kyc-homes-phase-ii"), getPublicAreaGuide()]);
  const price = guide.developerPrice;
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
          <span>Developer land price</span>
          <strong>{price?.visible ? formatPropertyPrice(price.amount) : "Ask DMZ for current pricing"}</strong>
          {price?.visible ? <small>{price.plotSizeSqm} sqm · price confirmed {price.confirmedAt}. Reconfirm current terms before payment.</small> : null}
        </div>
        <div>
          <span>Plot standard</span>
          <strong>{estate.plotSize}</strong>
          <small>Check the exact size of any individual property.</small>
        </div>
        <div>
          <span>Land only</span>
          <strong>Ask about approved building requirements</strong>
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
          <h2>Direct developer sale</h2>
          <p>
            Start with DMZ to review current availability and arrange an inspection.
            We help you prepare for developer approval, understand the approved
            terms, and follow the documented allocation process.
          </p>
          <Link href={developerLand ? `/properties/${developerLand.slug}` : "/contact"}>
            {developerLand ? "Explore available land" : "Ask about current availability"}
          </Link>
        </article>
        <article>
          <p className="eyebrow">Owner resale</p>
          <h2>Buying from an existing owner</h2>
          <p>
            The owner sets the asking price. Ownership, authority to sell,
            payment position, property identity, and the applicable estate
            transfer process must be confirmed before commitment.
          </p>
          <Link href="/verification">How DMZ verifies resales</Link>
          <p><Link href={buyingEnquiry("resale").contact}>Tell us your budget</Link></p>
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
