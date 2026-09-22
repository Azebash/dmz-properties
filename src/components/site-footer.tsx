import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { business } from "@/lib/business";
import { TrackedLink } from "@/components/tracked-link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-main">
        <div className="footer-brand">
          <Link className="brand-link" href="/" aria-label="DMZ Properties home">
            <BrandLockup />
          </Link>
          <p className="footer-statement">
            Property decisions built on clarity, access, and local knowledge.
          </p>
        </div>
        <div className="footer-column">
          <strong>Explore</strong>
          <Link href="/properties">Properties</Link>
          <Link href="/areas/kyc-homes-phase-ii">KYC Homes Phase II</Link>
          <Link href="/gallery">Estate gallery</Link>
          <Link href="/sell">Sell a property</Link>
          <Link href="/insights">Insights</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="footer-column">
          <strong>Talk to us</strong>
          <Link href="/contact">Make an enquiry</Link>
          <Link href="/book-inspection">Book an inspection</Link>
          <Link href="/buying-from-abroad">Buying from abroad</Link>
          <Link href="/guides/kyc-homes-phase-ii-buyer-guide">Buyer guide</Link>
        </div>
        <address className="footer-column footer-contact">
          <strong>Contact</strong>
          <a href={business.phone.href}>{business.phone.display}</a>
          <TrackedLink
            href={business.phone.whatsapp}
            eventName="whatsapp_click"
            eventData={{ placement: "footer" }}
            newTab
          >
            WhatsApp DMZ Properties
          </TrackedLink>
          <span>{business.address.display}</span>
        </address>
      </div>
      <div className="section-shell footer-bottom">
        <p>
          Copyright {new Date().getFullYear()} DMZ Properties. A venture of DMZ
          Enterprises Ltd.
        </p>
        <div className="footer-legal-links">
          <Link href="/verification">Verification</Link>
          <Link href="/payment-safety">Payment safety</Link>
          <Link href="/faqs">FAQs</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>{business.registrationNumber}</span>
        </div>
      </div>
    </footer>
  );
}
