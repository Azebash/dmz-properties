import type { Metadata } from "next";
import { PropertyBrowser } from "@/components/property-browser";
import { getPublishedProperties } from "@/lib/public-properties";
import { parseCatalogueFilters } from "@/lib/property-discovery";
import { BuyingOptions } from "@/components/buying-options";
import { getPublicAreaGuide } from "@/lib/public-area-guide";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Buying Options in KYC Homes, Abuja",
  description:
    "Discuss developer plots and owner resales in KYC Homes, Abuja. Tell DMZ your budget and explore selected properties.",
  alternates: { canonical: "/properties" },
};

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const [properties, guide] = await Promise.all([getPublishedProperties(), getPublicAreaGuide()]);
  const filters = parseCatalogueFilters(await searchParams, properties);
  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">Buying options</p>
        <h1 className="page-title">Find your property in KYC Homes, Abuja.</h1>
        <p>
          Tell us what you need. We can help you find suitable options, including properties that aren&apos;t listed here.
        </p>
      </section>
      <div className="section-shell section-block"><BuyingOptions price={guide.developerPrice} /></div>
      {properties.length ? <PropertyBrowser key={JSON.stringify(filters)} properties={properties} initialFilters={filters} /> : null}
    </main>
  );
}
