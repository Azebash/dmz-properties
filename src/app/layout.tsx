import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/analytics";
import { siteUrl } from "@/lib/site";
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
    name: "DMZ Properties",
    legalName: "DMZ Enterprises Ltd",
    identifier: "RC 9121009",
    url: siteUrl,
    description:
      "Independent property sales and advisory company specializing in verified property opportunities.",
    areaServed: {
      "@type": "Place",
      name: "Abuja, Federal Capital Territory, Nigeria",
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
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
