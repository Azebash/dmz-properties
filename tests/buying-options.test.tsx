import { describe, expect, it, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buyingEnquiry, selectHomepageProperties } from "../src/lib/buying-options";
import { BuyingOptions } from "../src/components/buying-options";
import { repositoryAreaGuideCopy } from "../src/lib/area-guide-copy";
import { properties } from "../src/lib/content";
import Home from "../src/app/page";
import PropertiesPage from "../src/app/properties/page";
import { PropertyDetail } from "../src/components/property-detail";

vi.mock("../src/lib/public-properties", () => ({ getPublishedProperties: vi.fn(async () => []) }));
vi.mock("../src/lib/public-articles", () => ({ getPublishedArticles: vi.fn(async () => []) }));
vi.mock("../src/lib/public-area-guide", () => ({ getPublicAreaGuide: vi.fn(async () => repositoryAreaGuideCopy) }));
afterEach(() => vi.clearAllMocks());

describe("personal buying options", () => {
  it("keeps homepage and buying routes usable without property posts", async () => {
    const home = renderToStaticMarkup(await Home());
    const catalogue = renderToStaticMarkup(await PropertiesPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) }));
    for (const html of [home, catalogue]) {
      expect(html).toContain("Looking to buy in KYC Homes Phase II?");
      expect(html).toContain("₦14,000,000");
      expect(html).toContain("Tell us your budget");
      expect(html).toContain("intent=resale");
      expect(html).not.toContain("No matching properties");
    }
    expect(home).not.toContain('id="selection-title"');
    expect(catalogue).not.toContain('id="search-properties"');
  });

  it("does not show a hidden or missing price", () => {
    for (const price of [null, { ...repositoryAreaGuideCopy.developerPrice!, visible: false }]) {
      const html = renderToStaticMarkup(<BuyingOptions price={price} />);
      expect(html).not.toContain("₦14,000,000");
      expect(html).toContain("current plot price");
      expect(html).toContain("Ask about resale options");
    }
  });

  it("shares public presentation without publishing draft structured data", () => {
    const html = renderToStaticMarkup(<PropertyDetail property={properties[0]} preview />);
    expect(html).toContain("600 sqm Virgin Land");
    expect(html).toContain("₦14,000,000");
    expect(html).not.toContain("application/ld+json");
    expect(html).not.toContain("Share property");
  });

  it("carries resale intent and the property reference in WhatsApp and contact links", () => {
    const enquiry = buyingEnquiry("resale", "DMZ-KYC-001");
    expect(decodeURIComponent(enquiry.whatsapp)).toContain("resale options from existing owners");
    expect(decodeURIComponent(enquiry.whatsapp)).toContain("DMZ-KYC-001");
    expect(enquiry.contact).toContain("intent=resale");
    expect(enquiry.contact).toContain("property=DMZ-KYC-001");
  });

  it("features selected properties first, fills with newest and keeps stable ties without mutating input", () => {
    const listing = properties[0];
    const rows = [
      { ...listing, slug: "new", publishedAt: "2026-09-30" },
      { ...listing, slug: "featured-b", publishedAt: "2026-09-20", isFeatured: true },
      { ...listing, slug: "featured-a", publishedAt: "2026-09-20", isFeatured: true },
      { ...listing, slug: "old", publishedAt: "2026-09-10" },
    ];
    expect(selectHomepageProperties(rows).map((p) => p.slug)).toEqual(["featured-a", "featured-b", "new"]);
    expect(rows[0].slug).toBe("new");
    expect(selectHomepageProperties(rows.filter((p) => !p.isFeatured)).map((p) => p.slug)).toEqual(["new", "old"]);
    expect(selectHomepageProperties(rows.map((p) => ({ ...p, isFeatured: true })))).toHaveLength(3);
    expect(selectHomepageProperties([])).toEqual([]);
  });
});
