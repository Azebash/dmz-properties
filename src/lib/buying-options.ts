import { business } from "@/lib/business";
import type { Property } from "@/lib/content";

export function formatPropertyPrice(amount: number, currency = "NGN") {
  const number = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(amount);
  return currency === "NGN" ? `₦${number}` : `${currency} ${number}`;
}

export type BuyingIntent = "options" | "developer" | "resale";

export function buyingEnquiry(intent: BuyingIntent, reference?: string) {
  const message = intent === "resale"
    ? "I would like to discuss resale options from existing owners in KYC Homes Phase II. Please help me find options within my budget."
    : intent === "developer"
      ? "I am interested in developer plots in KYC Homes Phase II. Please confirm the current price, availability, and additional charges."
      : "I am looking to buy in KYC Homes Phase II. Please help me find suitable options within my budget.";
  const params = new URLSearchParams({ interest: "Buying a plot", intent });
  if (reference) params.set("property", reference);
  return {
    message,
    contact: `/contact?${params}`,
    whatsapp: `${business.phone.whatsapp}?text=${encodeURIComponent(`Hello DMZ Properties, ${message}${reference ? ` Reference: ${reference}.` : ""}`)}`,
  };
}

export function selectHomepageProperties(properties: Property[]) {
  return [...properties].sort((a, b) =>
    Number(!!b.isFeatured) - Number(!!a.isFeatured) ||
    (b.publishedAt || "").localeCompare(a.publishedAt || "") ||
    a.slug.localeCompare(b.slug),
  ).slice(0, 3);
}
