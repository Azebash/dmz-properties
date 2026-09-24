import "server-only";

import { properties as repositoryProperties, type Property } from "@/lib/content";
import { usesDatabaseContent } from "@/lib/public-articles";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { PropertyRow } from "@/lib/supabase/types";

const estateContext = repositoryProperties[0];
const mediaPending = "/images/property-media-pending.svg";
const pageSize = 100;

export function propertyFromRow(row: PropertyRow): Property {
  if (!row.last_verified_at || !Array.isArray(row.features) ||
    !row.features.every((item) => typeof item === "string")) {
    throw new Error(`Published property ${row.reference} has incomplete verified content`);
  }
  const curated = row.source === "developer_inventory" && row.property_type === "Land" &&
    row.location_name === "KYC Homes Phase II"
    ? repositoryProperties.find((property) => property.reference === row.reference)
    : undefined;
  const contextualLand = row.source === "developer_inventory" && row.property_type === "Land" &&
    row.location_name === "KYC Homes Phase II";
  const gallery = curated?.gallery || (contextualLand ? estateContext.gallery : [mediaPending]);
  const imageLabel = curated?.imageLabel || (contextualLand ? "Estate context" : "Images pending");
  const amount = row.price_amount === null ? null : Number(row.price_amount);
  const price = amount !== null && amount > 0
    ? `${row.price_currency} ${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(amount)}`
    : row.price_label || "Price on request";
  const features = (row.features as string[]).flatMap((feature) => {
    if (row.reference === "DMZ-KYC-001" && row.source === "developer_inventory" &&
      feature.toLowerCase().includes("current developer price")) {
      return amount !== null && amount > 0 ? [`${price} current developer price`] : [];
    }
    return [feature];
  });

  return {
    slug: row.slug,
    reference: row.reference,
    title: row.title,
    type: row.property_type,
    location: row.location_name,
    ownership: row.ownership_label || (row.source === "owner_resale" ? "Owner resale" : "Developer inventory"),
    status: row.source === "owner_resale" ? "Owner resale" : "Developer inventory",
    price,
    priceAmount: amount !== null && amount > 0 ? amount : undefined,
    currency: row.price_currency,
    size: row.plot_size_sqm ? `${Number(row.plot_size_sqm)} sqm` : "Size on request",
    image: curated?.image || (contextualLand ? estateContext.image : mediaPending),
    imageLabel,
    gallery,
    description: row.description,
    features,
    updatedAt: row.updated_at.slice(0, 10),
    lastVerifiedAt: row.last_verified_at.slice(0, 10),
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
  };
}

async function fetchPublishedProperties(filters?: { slug?: string; offset?: number }): Promise<Property[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const endpoint = new URL("/rest/v1/properties", url);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("status", "eq.published");
  if (filters?.slug) endpoint.searchParams.set("slug", `eq.${filters.slug}`);
  endpoint.searchParams.set("order", "published_at.desc,slug.asc");
  endpoint.searchParams.set("limit", filters?.slug ? "1" : String(pageSize));
  if (filters?.offset) endpoint.searchParams.set("offset", String(filters.offset));
  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    next: { revalidate: 60, tags: ["published-properties"] },
  });
  if (!response.ok) throw new Error("Published property inventory is unavailable");
  return (await response.json() as PropertyRow[]).map(propertyFromRow);
}

export async function getPublishedProperties() {
  if (!usesDatabaseContent()) return repositoryProperties;
  const properties: Property[] = [];
  for (let offset = 0; offset <= 5_000; offset += pageSize) {
    const batch = await fetchPublishedProperties({ offset });
    properties.push(...batch);
    if (batch.length < pageSize) return properties;
  }
  throw new Error("Published property inventory exceeds the supported page range");
}

export async function getPublishedProperty(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  if (!usesDatabaseContent()) return repositoryProperties.find((property) => property.slug === slug);
  return (await fetchPublishedProperties({ slug }))[0];
}

export async function isPublishedPropertyReference(reference: string) {
  if (!usesDatabaseContent()) {
    return repositoryProperties.some((property) => property.reference === reference);
  }
  const { url, publishableKey } = getSupabaseConfig();
  const endpoint = new URL("/rest/v1/properties", url);
  endpoint.searchParams.set("select", "reference");
  endpoint.searchParams.set("status", "eq.published");
  endpoint.searchParams.set("reference", `eq.${reference}`);
  endpoint.searchParams.set("limit", "1");
  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Published property reference could not be verified");
  return (await response.json() as { reference: string }[]).some(
    (property) => property.reference === reference,
  );
}
