import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Property Payment Safety",
  description:
    "Practical payment safeguards for property buyers dealing with developer inventory or owner resales.",
  alternates: { canonical: "/payment-safety" },
};

const safeguards = [
  {
    title: "Confirm the transaction route",
    body: "Developer inventory and owner resales may use different agreements, recipients, and transfer procedures. Know which route applies before payment.",
  },
  {
    title: "Verify instructions independently",
    body: "Do not rely only on a forwarded message, social-media account, or verbal instruction. Reconfirm payment details through an established contact channel.",
  },
  {
    title: "Match the payee to the documents",
    body: "Ask why a specific person or entity is receiving funds and ensure that the explanation is consistent with the property documents and agreement.",
  },
  {
    title: "Keep complete records",
    body: "Retain agreements, approved payment instructions, transfer confirmations, receipts, and material correspondence for the transaction.",
  },
];

export default function PaymentSafetyPage() {
  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">Buyer protection</p>
        <h1 className="page-title">Pause before you pay.</h1>
        <p>
          Property payments should follow a documented, property-specific process.
          Urgency is not a substitute for confirmation.
        </p>
      </section>
      <section className="section-shell safety-grid">
        {safeguards.map((safeguard, index) => (
          <article key={safeguard.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{safeguard.title}</h2>
            <p>{safeguard.body}</p>
          </article>
        ))}
      </section>
      <section className="payment-warning">
        <div className="section-shell payment-warning-grid">
          <h2>Never pay simply because an account appears familiar.</h2>
          <div>
            <p>
              Account details can be copied, changed, or impersonated. Confirm the
              receiving account and transaction purpose using the approved process
              for that particular property.
            </p>
            <Link className="button button-primary" href="/contact">
              Confirm before payment
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
