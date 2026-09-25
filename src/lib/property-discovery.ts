import type { Property } from "@/lib/content";

export type CatalogueFilters = {
  q: string;
  type: string;
  ownership: string;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  sort: "newest" | "price_asc" | "price_desc" | "relevance";
};

export const filterKeys = ["q", "type", "ownership", "minPrice", "maxPrice", "minSize", "maxSize", "sort"] as const;

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function bound(value: string, limit: number) {
  if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(value)) return "";
  const amount = Number(value);
  return Number.isFinite(amount) && amount <= limit ? value : "";
}

export function parseCatalogueFilters(
  params: Record<string, string | string[] | undefined>, properties: Property[],
): CatalogueFilters {
  const type = first(params.type);
  const ownership = first(params.ownership);
  const sort = first(params.sort);
  return {
    q: first(params.q).trim().slice(0, 120),
    type: properties.some((property) => property.type === type) ? type : "all",
    ownership: properties.some((property) => property.ownership === ownership) ? ownership : "all",
    minPrice: bound(first(params.minPrice), 1_000_000_000_000),
    maxPrice: bound(first(params.maxPrice), 1_000_000_000_000),
    minSize: bound(first(params.minSize), 10_000_000),
    maxSize: bound(first(params.maxSize), 10_000_000),
    sort: sort === "price_asc" || sort === "price_desc" || sort === "relevance" ? sort : "newest",
  };
}

function relevance(property: Property, query: string) {
  if (!query) return 0;
  if (property.reference.toLowerCase() === query) return 5;
  if (property.title.toLowerCase().startsWith(query)) return 4;
  if (property.title.toLowerCase().includes(query)) return 3;
  if (property.reference.toLowerCase().includes(query)) return 2;
  return property.location.toLowerCase().includes(query) ? 1 : 0;
}

export function discoverProperties(properties: Property[], filters: CatalogueFilters) {
  const query = filters.q.toLowerCase();
  const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);
  const minSize = filters.minSize === "" ? null : Number(filters.minSize);
  const maxSize = filters.maxSize === "" ? null : Number(filters.maxSize);
  const filtered = properties.filter((property) => {
    if (query && !relevance(property, query)) return false;
    if (filters.type !== "all" && property.type !== filters.type) return false;
    if (filters.ownership !== "all" && property.ownership !== filters.ownership) return false;
    if (minPrice !== null || maxPrice !== null) {
      if (property.currency !== "NGN" || property.priceAmount === undefined) return false;
      if (minPrice !== null && property.priceAmount < minPrice) return false;
      if (maxPrice !== null && property.priceAmount > maxPrice) return false;
    }
    if (minSize !== null || maxSize !== null) {
      if (property.plotSizeSqm === undefined) return false;
      if (minSize !== null && property.plotSizeSqm < minSize) return false;
      if (maxSize !== null && property.plotSizeSqm > maxSize) return false;
    }
    return true;
  });

  const newest = (a: Property, b: Property) =>
    (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt)
      || a.slug.localeCompare(b.slug);
  if (filters.sort === "relevance") {
    return filtered.sort((a, b) => relevance(b, query) - relevance(a, query) || newest(a, b));
  }
  if (filters.sort === "price_asc" || filters.sort === "price_desc") {
    return filtered.sort((a, b) => {
      const aPrice = a.currency === "NGN" ? a.priceAmount : undefined;
      const bPrice = b.currency === "NGN" ? b.priceAmount : undefined;
      if (aPrice === undefined) return bPrice === undefined ? newest(a, b) : 1;
      if (bPrice === undefined) return -1;
      return (filters.sort === "price_asc" ? aPrice - bPrice : bPrice - aPrice) || newest(a, b);
    });
  }
  return filtered.sort(newest);
}
