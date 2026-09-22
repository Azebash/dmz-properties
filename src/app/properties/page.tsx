import type { Metadata } from "next";
import { PropertyBrowser } from "@/components/property-browser";
import { properties } from "@/lib/content";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Browse verified land, resales, and residential opportunities represented by DMZ Properties.",
  alternates: { canonical: "/properties" },
};

export default function PropertiesPage() {
  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">Available opportunities</p>
        <h1 className="page-title">Property with context.</h1>
        <p>
          Current developer inventory and approved owner resales, beginning with
          our specialist coverage of KYC Homes Phase II in Sabon Lugbe, Airport
          Road, Abuja.
        </p>
      </section>
      <PropertyBrowser properties={properties} />
    </main>
  );
}
