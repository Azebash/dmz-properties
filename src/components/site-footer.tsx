import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";

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
          <Link href="/sell">Sell a property</Link>
          <Link href="/insights">Insights</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="footer-column">
          <strong>Talk to us</strong>
          <Link href="/contact">Make an enquiry</Link>
          <Link href="/contact">Book an inspection</Link>
          <Link href="/buying-from-abroad">Buying from abroad</Link>
        </div>
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
          <span>RC 9121009</span>
        </div>
      </div>
    </footer>
  );
}
