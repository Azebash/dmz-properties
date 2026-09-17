import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about DMZ Properties, KYC Homes Phase II listings, owner resales, inspections, and remote buying.",
  alternates: { canonical: "/faqs" },
};

const faqs = [
  [
    "Is DMZ Properties the official KYC Homes Phase II website?",
    "No. DMZ Properties is independently managed. Its founder's professional role within KYC Homes Phase II provides firsthand knowledge, but this website is not the estate's official website.",
  ],
  [
    "What types of properties do you represent?",
    "We currently focus on developer inventory and verified client-owned resales within KYC Homes Phase II, including plots and developed residential properties.",
  ],
  [
    "Does every property go through the same checks?",
    "No. Developer inventory and owner resales require different checks. Every listing is reviewed according to its source and transaction route.",
  ],
  [
    "Can I inspect a property remotely?",
    "Yes. A live video inspection can be arranged for remote buyers, subject to availability and site access.",
  ],
  [
    "Do you accept payments on behalf of every seller?",
    "Payment instructions depend on the property and transaction. Buyers should use only payment details formally confirmed for that specific transaction.",
  ],
  [
    "Can an existing owner list a KYC Homes Phase II property through DMZ?",
    "Owners can submit a property for private review. DMZ Properties publishes it only after the required ownership and authority-to-sell checks.",
  ],
  [
    "Does verification replace a lawyer or surveyor?",
    "No. Buyers should obtain independent professional advice where appropriate. Our process supports informed decisions but does not replace legal or survey advice.",
  ],
  [
    "How do I receive current prices and availability?",
    "Submit an enquiry with your requirements. Availability and approved terms should be reconfirmed before making a purchase decision.",
  ],
];

export default function FaqPage() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <section className="section-shell page-hero">
        <p className="eyebrow">Frequently asked questions</p>
        <h1 className="page-title">Clear answers before commitment.</h1>
      </section>
      <section className="section-shell faq-list">
        {faqs.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <section className="section-shell final-cta">
        <p>Still have a specific question?</p>
        <h2>Ask before you decide.</h2>
        <Link className="button button-primary" href="/contact">
          Make an enquiry
        </Link>
      </section>
    </main>
  );
}
