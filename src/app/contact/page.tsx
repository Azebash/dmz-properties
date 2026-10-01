import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { business } from "@/lib/business";
import { TrackedLink } from "@/components/tracked-link";
import { buyingEnquiry } from "@/lib/buying-options";

export const metadata: Metadata = {
  title: "Make an Enquiry",
  description:
    "Tell DMZ Properties what you are looking for or request a property inspection.",
  alternates: { canonical: "/contact" },
};

type ContactPageProps = {
  searchParams: Promise<{ property?: string; interest?: string; intent?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const intent = params.intent === "developer" || params.intent === "resale" || params.intent === "options" ? params.intent : null;
  const allowedInterests = [
    "Buying a plot",
    "Buying a developed property",
    "Booking an inspection",
  ];
  const defaultInterest = intent ? "Buying a plot" : allowedInterests.includes(params.interest || "")
    ? params.interest
    : "";

  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">Make an enquiry</p>
        <h1 className="page-title">Tell us what you need.</h1>
        <p>
          Share your requirements and we will help you identify a relevant
          property or arrange an inspection.
        </p>
      </section>
      <section className="section-shell contact-panel">
        <div className="contact-copy">
          <h2>Start with the essentials.</h2>
          <p>
            Tell us what you&apos;re looking for, your budget, and when you hope to buy. We&apos;ll discuss suitable options and current prices with you.
          </p>
          <div className="contact-details">
            <div>
              <span>Call</span>
              <a href={business.phone.href}>{business.phone.international}</a>
            </div>
            <div>
              <span>WhatsApp</span>
              <TrackedLink
                href={buyingEnquiry(intent || "options", params.property?.slice(0, 100)).whatsapp}
                eventName="whatsapp_click"
                eventData={{ placement: "contact_page" }}
                newTab
              >
                Start a conversation
              </TrackedLink>
            </div>
            <div>
              <span>Office</span>
              <address>{business.address.display}</address>
            </div>
          </div>
        </div>
        <EnquiryForm
          defaultInterest={defaultInterest}
          defaultMessage={intent ? buyingEnquiry(intent).message : ""}
          propertyReference={params.property?.slice(0, 100)}
        />
      </section>
    </main>
  );
}
