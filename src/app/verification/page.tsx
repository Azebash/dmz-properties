import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Property Verification Process",
  description:
    "Understand how DMZ Properties reviews developer inventory and owner resales before publication.",
  alternates: { canonical: "/verification" },
};

const checks = [
  {
    number: "01",
    title: "Identify the source",
    body: "We establish whether the opportunity is developer inventory or an existing owner's resale because each follows a different process.",
  },
  {
    number: "02",
    title: "Review ownership records",
    body: "For resales, the seller's identity, ownership evidence, payment position, and authority to sell must align.",
  },
  {
    number: "03",
    title: "Confirm the property",
    body: "The represented plot or property is matched to the relevant records and physically inspected where appropriate.",
  },
  {
    number: "04",
    title: "Clarify the terms",
    body: "Approved price, transfer costs, payment expectations, and the applicable process are documented for the buyer.",
  },
  {
    number: "05",
    title: "Keep an evidence trail",
    body: "Material representations, receipts, approvals, and transaction documents should remain traceable throughout the purchase.",
  },
];

export default function VerificationPage() {
  return (
    <main>
      <section className="verification-hero">
        <div className="section-shell">
          <p className="eyebrow">Our verification standard</p>
          <h1>Trust should leave a paper trail.</h1>
          <p>
            We do not treat familiarity with an estate as a substitute for
            checking the specific property and transaction being presented.
          </p>
        </div>
      </section>
      <section className="section-shell verification-list">
        {checks.map((check) => (
          <article key={check.number}>
            <span>{check.number}</span>
            <h2>{check.title}</h2>
            <p>{check.body}</p>
          </article>
        ))}
      </section>
      <section className="verification-boundary">
        <div className="section-shell verification-boundary-grid">
          <h2>What verification does not replace.</h2>
          <div>
            <p>
              Buyers should still use an independent lawyer, surveyor, or other
              qualified professional where the transaction requires it. DMZ
              Properties provides property information and transaction support;
              it does not replace independent legal advice.
            </p>
            <Link className="button button-primary" href="/contact">
              Ask about a property
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
