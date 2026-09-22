import { describe, expect, it } from "vitest";
import { articles, properties } from "../src/lib/content";
import { business, estate } from "../src/lib/business";
import { estateImages, galleryCategories } from "../src/lib/gallery";

describe("property content", () => {
  it("uses unique slugs and references", () => {
    expect(new Set(properties.map(({ slug }) => slug)).size).toBe(properties.length);
    expect(new Set(properties.map(({ reference }) => reference)).size).toBe(
      properties.length,
    );
  });

  it("contains the fields required by property pages", () => {
    for (const property of properties) {
      expect(property.title).toBeTruthy();
      expect(property.location).toBeTruthy();
      expect(property.gallery.length).toBeGreaterThanOrEqual(3);
      expect(property.features.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(property.updatedAt))).toBe(false);
      expect(property.image.startsWith("/") || URL.canParse(property.image)).toBe(true);
    }
  });
});

describe("article content", () => {
  it("uses unique slugs and publishable records", () => {
    expect(new Set(articles.map(({ slug }) => slug)).size).toBe(articles.length);

    for (const article of articles) {
      expect(article.title).toBeTruthy();
      expect(article.sections.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(article.publishedAt))).toBe(false);
      expect(Number.isNaN(Date.parse(article.updatedAt))).toBe(false);
    }
  });
});

describe("business content", () => {
  it("contains publishable legal and contact details", () => {
    expect(business.legalName).toBe("DMZ Enterprises Ltd");
    expect(business.registrationNumber).toBe("RC 9121009");
    expect(business.phone.whatsapp).toMatch(/^https:\/\/wa\.me\/234/);
    expect(business.address.display).toContain("Garki II, Abuja");
    expect(estate.developer).toBe("KYC Interproject Limited");
    expect(estate.developerRegistrationNumber).toBe("RC 873737");
  });
});

describe("estate gallery content", () => {
  it("uses unique local images with valid categories and descriptions", () => {
    expect(new Set(estateImages.map(({ src }) => src)).size).toBe(estateImages.length);
    for (const image of estateImages) {
      expect(image.src).toMatch(/^\/images\/estate\/.+\.webp$/);
      expect(image.alt.length).toBeGreaterThan(15);
      expect(image.caption).toBeTruthy();
      expect(galleryCategories).toContain(image.category);
    }
  });
});
