import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { business, estate } from "@/lib/business";

export const metadata: Metadata = {
  title: "Book a Property Inspection",
  description:
    "Request a physical, representative, or live-video inspection for property at KYC Homes Phase II in Sabon Lugbe, Abuja.",
  alternates: { canonical: "/book-inspection" },
};

type InspectionPageProps = {
  searchParams: Promise<{ property?: string }>;
};

export default async function InspectionPage({ searchParams }: InspectionPageProps) {
  const params = await searchParams;

  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">Inspection request</p>
        <h1 className="page-title">See the property before you decide.</h1>
        <p>
          Request a physical visit, representative inspection, or live video
          session at {estate.name}. Your appointment is confirmed only after our
          team responds.
        </p>
      </section>
      <section className="section-shell contact-panel inspection-panel">
        <div className="contact-copy">
          <h2>Choose a suitable window.</h2>
          <p>
            Provide a preferred and alternate date. Remote buyers should include
            their time zone so we can coordinate a live session.
          </p>
          <div className="inspection-note">
            <span>Direct assistance</span>
            <a href={business.phone.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp {business.phone.display}
            </a>
          </div>
        </div>
        <EnquiryForm
          mode="inspection"
          defaultInterest="Booking an inspection"
          propertyReference={params.property?.slice(0, 100)}
          submitLabel="Request inspection"
        />
      </section>
    </main>
  );
}
