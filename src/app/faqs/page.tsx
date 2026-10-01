import type { Metadata } from "next";
import Link from "next/link";
import { getPublicAreaGuide } from "@/lib/public-area-guide";
import { formatPropertyPrice } from "@/lib/buying-options";
import type { DeveloperPrice } from "@/lib/area-guide-copy";
import { serializeStructuredData } from "@/lib/structured-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about DMZ Properties, KYC Homes Phase II listings, owner resales, inspections, and remote buying.",
  alternates: { canonical: "/faqs" },
};

function buildFaqs(price: DeveloperPrice | null) {
  const currentPrice = price?.visible ? formatPropertyPrice(price.amount) : null;
  return [
  [
    "What is the developer’s price for a plot?",
    currentPrice
      ? `The quoted KYC Interproject Limited price is ${currentPrice} for a ${price?.plotSizeSqm} sqm land plot at KYC Homes Phase II, confirmed ${price?.confirmedAt}. This is the land price. Price, availability, charges, and payment instructions must be reconfirmed before payment.`
      : "Ask DMZ for the current KYC Interproject Limited price and availability for 600 sqm virgin land. Charges and payment instructions must be reconfirmed before payment.",
  ],
  [
    "Can an owner resale cost less than a developer plot?",
    "A resale may cost less than the developer’s quoted plot price. Each owner sets their asking price, and availability varies. Tell us your budget and we’ll discuss current options, ownership checks, and applicable charges.",
  ],
  [
    "Can the developer price be paid in parts?",
    "KYC Interproject Limited publishes full or part-payment options. The exact schedule, qualifying payment, additional charges, and price-lock conditions must be confirmed in the approved offer and official process.",
  ],
  [
    "When should payment be made?",
    "The official onboarding terms state that payment should be made after developer approval. Do not transfer funds solely because an application or informal message has been received.",
  ],
  [
    "What charges apply after allocation?",
    "Published charge categories include infrastructure, development levy, building plan, legal fee, and administrative charges. Obtain the current amount for each charge in the approved offer before payment.",
  ],
  [
    "What happens if a part-payment installment is missed?",
    "The published onboarding terms state that installment default may be viewed as withdrawal of interest and that refunds attract a 20% administrative charge. Buyers must review the current signed terms before choosing part payment.",
  ],
  [
    "Does the land price include a house?",
    "No. The developer plot price is for land. Ask DMZ about the estate’s approved building requirements, the exact plot size, and the additional costs for the property you are considering.",
  ],
  [
    "Is DMZ Properties the official KYC Homes Phase II website?",
    "No. DMZ Properties is independently managed. Its founder's professional role within KYC Homes Phase II provides firsthand knowledge, but this website is not the estate's official website.",
  ],
  [
    "What types of properties do you represent?",
    "We help buyers find land, homes, and other properties within KYC Homes, Abuja, including properties sold by the developer and resales offered by existing owners. Ask us about current availability.",
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
    "Owners can contact us about selling their property. We review ownership records and the owner's authority to sell before offering it to buyers.",
  ],
  [
    "Does verification replace a lawyer or surveyor?",
    "No. Buyers should obtain independent professional advice where appropriate. Our process supports informed decisions but does not replace legal or survey advice.",
  ],
  [
    "How do I receive current prices and availability?",
    "Submit an enquiry with your requirements. The current developer virgin-land price is published, while resale prices are owner-set. Availability and approved terms are reconfirmed before a purchase decision.",
  ],
  ];
}

export default async function FaqPage() {
  const guide = await getPublicAreaGuide();
  const faqs = buildFaqs(guide.developerPrice);
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
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(faqData) }}
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
