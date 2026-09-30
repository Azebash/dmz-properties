import type { Metadata } from "next";
import { business } from "@/lib/business";
import { PrivacyPreferences } from "@/components/privacy-preferences";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DMZ Properties handles website and enquiry information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main>
      <header className="section-shell page-hero legal-hero">
        <p className="eyebrow">Legal</p>
        <h1 className="page-title">Privacy policy</h1>
        <p>Last updated September 30, 2026</p>
      </header>
      <article className="section-shell legal-copy">
        <h2>Information we collect</h2>
        <p>
          When you submit an enquiry, we may collect your name, contact details,
          location, property interests, budget, timeline, and any information you
          include in your message.
        </p>
        <h2>How we use information</h2>
        <p>
          We use enquiry information to respond, recommend relevant properties,
          arrange inspections, review seller submissions, maintain transaction
          records, and improve our services. We do not sell personal information.
        </p>
        <h2>Sharing and retention</h2>
        <p>
          Information may be shared with relevant property owners, developers,
          estate administrators, or professional advisers when necessary for an
          enquiry or transaction. We retain information only for operational,
          legal, and legitimate business requirements.
        </p>
        <p>
          We use security checks to protect enquiry forms from spam and repeated
          submissions. These checks may process technical information about your
          connection. Where Cloudflare Turnstile is used, it processes information
          to distinguish genuine visitors from automated requests. Connection
          identifiers used to limit repeated submissions are stored in a hashed form.
        </p>
        <h2>Analytics and browser storage</h2>
        <p>
          If analytics is enabled, the website asks for permission before loading
          Google Analytics. Your choice is stored in your browser so the site can
          respect it on later visits. Declining optional analytics does not prevent
          you from using the website or submitting an enquiry.
        </p>
        <p>
          If you arrive through an advertisement or referral link, we may remember
          that source during your visit and include it with an enquiry you submit.
          This helps us understand how you found us without creating a public user profile.
        </p>
        <PrivacyPreferences />
        <h2>Your choices</h2>
        <p>
          You may request access, correction, or deletion of your personal
          information, subject to applicable legal and record-keeping obligations.
          Privacy requests can be submitted through our enquiry form or by calling
          {` ${business.phone.international}`}.
        </p>
      </article>
    </main>
  );
}
