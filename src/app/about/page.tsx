import type { Metadata } from "next";
import Link from "next/link";
import { business, estate } from "@/lib/business";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about DMZ Properties, our independent operation, and our specialist knowledge of KYC Homes Phase II in Abuja.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">About DMZ Properties</p>
        <h1 className="page-title">Independent by design. Informed by access.</h1>
      </section>
      <section className="section-shell about-grid">
        <h2>Built for clearer property decisions.</h2>
        <div className="about-copy">
          <p>
            {business.brandName} is an independently operated real estate company
            specializing in property sales, resales, and buyer guidance.
            It is a property venture of {business.legalName}, registered under
            {` ${business.registrationNumber}`}.
          </p>
          <p>
            Our current strength is {estate.name} in Sabon Lugbe, Abuja. Our
            founder&apos;s professional relationship with {estate.developer} provides
            firsthand knowledge of the development, available inventory, and
            transaction processes. We represent both developer-owned properties
            and verified properties offered for resale by existing owners.
          </p>
          <p>
            <strong>DMZ Properties is independently managed and is not the
            official website of KYC Homes Phase II.</strong>
          </p>
          <p>
            As we expand into new locations and future developments, the same
            principle will guide our work: understand every property we present
            and communicate what buyers need to know plainly.
          </p>
          <Link className="button button-primary section-action" href="/contact">
            Talk to us
          </Link>
        </div>
      </section>
      <section className="founder-section">
        <div className="section-shell founder-grid">
          <div>
            <p className="eyebrow">Founder</p>
            <h2>{business.founder.name}</h2>
            <p className="founder-title">{business.founder.title}</p>
          </div>
          <div className="founder-copy">
            <p>{business.founder.relationship}</p>
            <p>
              This working relationship supports direct familiarity with the
              estate while DMZ Properties remains independently operated through
              {` ${business.legalName}`}.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
