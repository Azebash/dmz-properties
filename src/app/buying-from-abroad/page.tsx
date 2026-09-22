import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buying Property From Abroad",
  description:
    "A clear remote buying process for people considering property in KYC Homes Phase II, Abuja, while living abroad.",
  alternates: { canonical: "/buying-from-abroad" },
};

const remoteSteps = [
  ["Brief", "Tell us the intended use, budget, preferred property, and timeline."],
  ["Shortlist", "Receive relevant options with current details rather than a generic catalogue."],
  ["Inspect", "Join a live video inspection and review location and property evidence."],
  ["Verify", "Use the applicable estate checks and independent professional advice."],
  ["Complete", "Follow documented payment, transfer, and document-delivery steps."],
];

export default function BuyingFromAbroadPage() {
  return (
    <main>
      <section className="section-shell page-hero remote-hero">
        <p className="eyebrow">Buying from abroad</p>
        <h1 className="page-title">Distance should not reduce clarity.</h1>
        <p>
          DMZ Properties supports remote buyers with live inspections, clear
          records, and a transaction process that can be followed from anywhere.
        </p>
        <Link className="button button-primary section-action" href="/contact">
          Discuss your requirements
        </Link>
        <Link className="text-link remote-inspection-link" href="/book-inspection">
          Request a live inspection
        </Link>
      </section>
      <section className="remote-process">
        <div className="section-shell">
          <h2>A remote process with visible steps.</h2>
          <ol>
            {remoteSteps.map(([title, body], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section-shell remote-principles">
        <div>
          <h2>Keep control of the transaction.</h2>
          <p>
            Remote buying should be more documented, not less. Avoid relying on
            edited footage, verbal promises, or payment instructions that cannot
            be independently confirmed.
          </p>
        </div>
        <div className="remote-principle-grid">
          <article>
            <strong>See it live</strong>
            <p>Request a live inspection and ask to see access and surroundings.</p>
          </article>
          <article>
            <strong>Verify independently</strong>
            <p>Use qualified professionals where legal or survey advice is needed.</p>
          </article>
          <article>
            <strong>Pay traceably</strong>
            <p>Confirm official payment details and retain complete records.</p>
          </article>
          <article>
            <strong>Receive documents</strong>
            <p>Agree how originals, copies, receipts, and transfers will be delivered.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
