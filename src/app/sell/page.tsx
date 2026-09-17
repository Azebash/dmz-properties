import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Sell Property in KYC Homes Phase II, Abuja",
  description:
    "Submit your KYC Homes Phase II plot or property for private ownership review and professional resale representation by DMZ Properties.",
  alternates: {
    canonical: "/sell",
  },
};

const requirements = [
  "Evidence of ownership or allocation",
  "Valid identification matching the ownership record",
  "Plot or property details",
  "Authority to sell where an owner is represented",
  "An agreed asking price and transaction terms",
];

export default function SellPage() {
  return (
    <main>
      <section className="section-shell page-hero seller-hero">
        <p className="eyebrow">For existing owners</p>
        <h1 className="page-title">Sell with the details in order.</h1>
        <p>
          DMZ Properties privately reviews KYC Homes Phase II properties before offering
          them to qualified buyers. Submission does not guarantee publication.
        </p>
        <Link className="button button-primary section-action" href="#seller-enquiry">
          Submit a property
        </Link>
      </section>

      <section className="section-shell contact-panel seller-enquiry" id="seller-enquiry">
        <div className="contact-copy">
          <p className="eyebrow">Private submission</p>
          <h2>Tell us about your property.</h2>
          <p>
            Do not send sensitive documents through this form. We will explain
            the secure review process after the initial assessment.
          </p>
        </div>
        <EnquiryForm
          defaultInterest="Selling my KYC Homes Phase II property"
          submitLabel="Request a resale review"
        />
      </section>

      <section className="seller-process">
        <div className="section-shell seller-process-grid">
          <div>
            <p className="eyebrow">The resale process</p>
            <h2>Representation, not open listing.</h2>
          </div>
          <ol>
            <li>
              <strong>01</strong>
              <div>
                <h3>Initial review</h3>
                <p>We review the property, ownership position, and sale terms.</p>
              </div>
            </li>
            <li>
              <strong>02</strong>
              <div>
                <h3>Estate confirmation</h3>
                <p>
                  Relevant records and the applicable transfer process are
                  confirmed before marketing begins.
                </p>
              </div>
            </li>
            <li>
              <strong>03</strong>
              <div>
                <h3>Prepared presentation</h3>
                <p>
                  Approved properties receive clear details, current media, and
                  coordinated buyer enquiries.
                </p>
              </div>
            </li>
            <li>
              <strong>04</strong>
              <div>
                <h3>Documented transfer</h3>
                <p>
                  Buyer discussions and the eventual transfer follow the agreed
                  estate procedure.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section-shell seller-requirements">
        <div>
          <h2>What to prepare</h2>
          <p>
            Complete information helps us assess a resale quickly and protects
            both the owner and prospective buyer.
          </p>
        </div>
        <ul>
          {requirements.map((requirement) => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
      </section>

      <section className="section-shell final-cta">
        <p>Own property within KYC Homes Phase II?</p>
        <h2>Begin a private resale review.</h2>
        <Link className="button button-primary" href="#seller-enquiry">
          Submit a property
        </Link>
      </section>
    </main>
  );
}
