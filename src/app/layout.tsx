import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/analytics";
import { allowIndexing, siteUrl } from "@/lib/site";
import { business } from "@/lib/business";
import { AttributionCapture } from "@/components/attribution-capture";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DMZ Properties | Verified Property Opportunities",
    template: "%s | DMZ Properties",
  },
  description:
    "Explore verified property opportunities in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja, with firsthand guidance from DMZ Properties.",
  alternates: { canonical: "/" },
  robots: {
    index: allowIndexing,
    follow: allowIndexing,
  },
  openGraph: {
    title: "DMZ Properties",
    description: "Property, properly considered.",
    type: "website",
    siteName: "DMZ Properties",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DMZ Properties",
    description: "Property, properly considered.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: business.brandName,
    legalName: business.legalName,
    identifier: business.registrationNumber,
    url: siteUrl,
    description:
      "Independent property sales and advisory company specializing in verified property opportunities.",
    areaServed: {
      "@type": "Place",
      name: "Abuja, Federal Capital Territory, Nigeria",
    },
    founder: {
      "@type": "Person",
      name: business.founder.name,
      jobTitle: business.founder.title,
    },
    telephone: business.phone.international,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      addressCountry: "NG",
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <SiteHeader />
        <AttributionCapture />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
