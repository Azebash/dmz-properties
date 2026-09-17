import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";

const navigation = [
  { href: "/properties", label: "Properties" },
  { href: "/areas/kyc-homes-phase-ii", label: "KYC Homes II" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="section-shell nav-shell">
        <Link className="brand-link" href="/" aria-label="DMZ Properties home">
          <BrandLockup />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link className="nav-cta" href="/contact">
            Make an enquiry
          </Link>
        </nav>
        <details className="mobile-nav">
          <summary>Menu</summary>
          <nav className="mobile-menu" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact">Make an enquiry</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
