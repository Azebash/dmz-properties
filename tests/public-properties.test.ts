import { afterEach, describe, expect, it, vi } from "vitest";
import { properties } from "../src/lib/content";
import {
  getPublishedProperty, getPublishedProperties, isPublishedPropertyReference,
} from "../src/lib/public-properties";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureDatabase() {
  vi.stubEnv("SUPABASE_CONTENT_SOURCE", "database");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
}

const publishedRow = {
  slug: "600sqm-virgin-land-kyc-homes-phase-ii",
  reference: "DMZ-KYC-001",
  title: "600 sqm Virgin Land",
  source: "developer_inventory",
  property_type: "Land",
  location_name: "KYC Homes Phase II",
  status: "published",
  ownership_label: "Developer inventory",
  price_amount: 14000000,
  price_currency: "NGN",
  price_label: "NGN 14,000,000",
  plot_size_sqm: 600,
  description: properties[0].description,
  features: properties[0].features,
  last_verified_at: "2026-09-22T13:00:00Z",
  updated_at: "2026-09-23T14:00:00Z",
  seo_title: null,
  seo_description: null,
};

describe("public property publishing", () => {
  it("retains the verified repository listing as an explicit rollback", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "repository");
    expect(await getPublishedProperties()).toEqual(properties);
    expect(await getPublishedProperty(properties[0].slug)).toEqual(properties[0]);
  });

  it("reads only published database rows and retains the existing plot URL and context photos", async () => {
    configureDatabase();
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify([publishedRow])),
    ));
    vi.stubGlobal("fetch", fetcher);
    const [property] = await getPublishedProperties();
    expect(property).toMatchObject({
      slug: properties[0].slug,
      reference: "DMZ-KYC-001",
      price: "NGN 14,000,000",
      lastVerifiedAt: "2026-09-22",
      updatedAt: "2026-09-23",
      imageLabel: "Estate context",
      gallery: properties[0].gallery,
    });
    expect(String(fetcher.mock.calls[0][0])).toContain("status=eq.published");
    expect(fetcher.mock.calls[0][1].headers.apikey).toBe("public-key");
    expect((await getPublishedProperty(property.slug))?.reference).toBe("DMZ-KYC-001");
  });

  it("does not present a resale without media as a photograph of that property", async () => {
    configureDatabase();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      ...publishedRow,
      slug: "approved-owner-resale",
      reference: "DMZ-RESALE-101",
      source: "owner_resale",
      price_amount: null,
      price_label: "Price on request",
    }]))));
    expect((await getPublishedProperties())[0]).toMatchObject({
      imageLabel: "Images pending",
      gallery: ["/images/property-media-pending.svg"],
      price: "Price on request",
    });
  });

  it("does not reuse curated developer imagery after its source becomes a resale", async () => {
    configureDatabase();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      ...publishedRow, source: "owner_resale",
    }]))));
    expect((await getPublishedProperties())[0].imageLabel).toBe("Images pending");
  });

  it("keeps numeric price claims and structured-data currency tied to the saved amount", async () => {
    configureDatabase();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      ...publishedRow, price_currency: "USD", price_amount: 15000000,
    }]))));
    expect((await getPublishedProperties())[0]).toMatchObject({
      price: "USD 15,000,000",
      currency: "USD",
      features: expect.arrayContaining(["USD 15,000,000 current developer price"]),
    });
  });

  it("paginates published inventory and validates a reference without cached catalogue data", async () => {
    configureDatabase();
    const fetcher = vi.fn().mockImplementation((input: URL, options?: RequestInit) => {
      const endpoint = new URL(input);
      if (endpoint.searchParams.has("reference")) {
        expect(options?.cache).toBe("no-store");
        return Promise.resolve(new Response(JSON.stringify([{ reference: "DMZ-KYC-001" }])));
      }
      const offset = Number(endpoint.searchParams.get("offset") || 0);
      const rows = Array.from({ length: offset ? 1 : 100 }, (_, index) => ({
        ...publishedRow, reference: `DMZ-LIST-${offset + index}`,
        slug: `listing-${offset + index}`,
      }));
      return Promise.resolve(new Response(JSON.stringify(rows)));
    });
    vi.stubGlobal("fetch", fetcher);
    expect(await getPublishedProperties()).toHaveLength(101);
    expect(await isPublishedPropertyReference("DMZ-KYC-001")).toBe(true);
    expect(fetcher.mock.calls[2][1].cache).toBe("no-store");
    expect(String(fetcher.mock.calls[2][0])).toContain("status=eq.published");
  });

  it("fails closed when published inventory is unavailable or unverified", async () => {
    configureDatabase();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(getPublishedProperties()).rejects.toThrow("Published property inventory is unavailable");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      ...publishedRow,
      last_verified_at: null,
    }]))));
    await expect(getPublishedProperties()).rejects.toThrow("incomplete verified content");
  });

  it("does not silently roll back when the content source is mistyped", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "databsae");
    await expect(getPublishedProperties()).rejects.toThrow("must be database or repository");
  });

  it("requires an explicit rollback source in a configured production build", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    await expect(getPublishedProperties()).rejects.toThrow("must be database or repository");
  });
});
