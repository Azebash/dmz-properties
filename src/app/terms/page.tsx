import type { Metadata } from "next";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the DMZ Properties website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main>
      <header className="section-shell page-hero legal-hero">
        <p className="eyebrow">Legal</p>
        <h1 className="page-title">Terms of use</h1>
        <p>Last updated September 17, 2026</p>
      </header>
      <article className="section-shell legal-copy">
        <h2>Website information</h2>
        <p>
          Property information is provided for general enquiry purposes and may
          change without notice. Availability, price, dimensions, ownership,
          payment terms, and documentation must be reconfirmed before commitment.
        </p>
        <h2>Independent operation</h2>
        <p>
          DMZ Properties is a venture of DMZ Enterprises Ltd, RC 9121009. It is
          independently managed and is not the official website of KYC Homes
          Phase II.
        </p>
        <h2>No professional advice</h2>
        <p>
          Website content does not constitute legal, financial, surveying, or
          investment advice. Buyers and sellers should engage qualified independent
          professionals where appropriate.
        </p>
        <h2>Transactions and payments</h2>
        <p>
          A website enquiry does not reserve a property or create a binding sale.
          Use only written payment instructions confirmed for the specific
          transaction and retain all receipts and agreements.
        </p>
        <h2>Final review</h2>
        <p>
          These terms are an operational draft and must be reviewed by local legal
          counsel before the website is opened to the public.
        </p>
        <h2>Contact</h2>
        <p>
          DMZ Properties operates from {business.address.display}. Telephone and
          WhatsApp enquiries can be made through {business.phone.international}.
        </p>
      </article>
    </main>
  );
}
