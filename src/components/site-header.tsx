"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { BrandLockup } from "@/components/brand-lockup";

const navigation = [
  { href: "/properties", label: "Properties" },
  { href: "/areas/kyc-homes-phase-ii", label: "KYC Homes II" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => {
    if (menu.current) menu.current.open = false;
  };
  return (
    <header className="site-header">
      {pathname === "/" ? <a className="skip-link" href="#main-content">Skip to content</a> : null}
      <div className="section-shell nav-shell">
        <Link className="brand-link" href="/" aria-label="DMZ Properties home">
          <BrandLockup />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <Link className="nav-cta" href="/contact">
            Make an enquiry
          </Link>
        </nav>
        <details ref={menu} className="mobile-nav" onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeMenu();
            menu.current?.querySelector("summary")?.focus();
          }
        }}>
          <summary>Menu</summary>
          <nav className="mobile-menu" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact" onClick={closeMenu}>Make an enquiry</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
