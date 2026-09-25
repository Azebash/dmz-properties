import { describe, expect, it } from "vitest";
import { properties as listed, type Property } from "@/lib/content";
import { discoverProperties, parseCatalogueFilters } from "@/lib/property-discovery";

const land = { ...listed[0], publishedAt: "2026-09-15" };
const home: Property = {
  ...land, slug: "developed-home", reference: "DMZ-HOME-2", title: "Developed home",
  type: "House", ownership: "Owner resale", priceAmount: 22_000_000,
  plotSizeSqm: 450, publishedAt: "2026-09-20",
};
const unpriced: Property = {
  ...home, slug: "unpriced-home", reference: "DMZ-HOME-3", title: "Another home",
  price: "Price on request", priceAmount: undefined, plotSizeSqm: undefined,
  publishedAt: "2026-09-21",
};
const foreign: Property = {
  ...home, slug: "foreign-home", reference: "DMZ-HOME-4", title: "Foreign-priced home",
  currency: "USD", priceAmount: 5_000, publishedAt: "2026-09-19",
};
const catalogue = [land, home, unpriced, foreign];

function discover(params: Record<string, string>) {
  return discoverProperties(catalogue, parseCatalogueFilters(params, catalogue)).map((property) => property.slug);
}

describe("catalogue discovery", () => {
  it("filters by verified numeric ranges, excluding missing and other-currency values", () => {
    expect(discover({ maxPrice: "14000000", minSize: "600" })).toEqual([land.slug]);
    expect(discover({ minPrice: "25000000" })).toEqual([]);
    expect(discover({ maxSize: "400" })).toEqual([]);
    expect(discover({ type: "House", ownership: "Owner resale", minSize: "450" }))
      .toEqual([home.slug, foreign.slug]);
  });

  it("sorts newest, priced NGN listings, and search relevance predictably", () => {
    expect(discover({})).toEqual([unpriced.slug, home.slug, foreign.slug, land.slug]);
    expect(discover({ sort: "price_asc" })).toEqual([land.slug, home.slug, unpriced.slug, foreign.slug]);
    expect(discover({ sort: "price_desc" })).toEqual([home.slug, land.slug, unpriced.slug, foreign.slug]);
    expect(discover({ q: "DMZ-HOME-2", sort: "relevance" })).toEqual([home.slug]);
    expect(discover({ q: "home", sort: "relevance" })).toEqual([unpriced.slug, home.slug, foreign.slug, land.slug]);
  });

  it("normalizes invalid or repeated URL values rather than misapplying filters", () => {
    const filters = parseCatalogueFilters({
      type: "Land", ownership: "Unverified", minPrice: "-10", maxPrice: "Infinity",
      minSize: "1e3", maxSize: "10000001", sort: "unknown", q: ["injected", "repeat"],
    }, catalogue);
    expect(filters).toMatchObject({ type: "Land", ownership: "all", minPrice: "", maxPrice: "",
      minSize: "", maxSize: "", sort: "newest", q: "" });
  });
});
