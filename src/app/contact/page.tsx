import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Make an Enquiry",
  description:
    "Tell DMZ Properties what you are looking for or request a property inspection.",
};

type ContactPageProps = {
  searchParams: Promise<{ property?: string; interest?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const allowedInterests = [
    "Buying a plot",
    "Buying a developed property",
    "Booking an inspection",
  ];
  const defaultInterest = allowedInterests.includes(params.interest || "")
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
            Your location, intended use, budget, and preferred purchase timeline
            help us respond with useful options rather than a generic list.
          </p>
        </div>
        <EnquiryForm
          defaultInterest={defaultInterest}
          propertyReference={params.property?.slice(0, 100)}
        />
      </section>
    </main>
  );
}
