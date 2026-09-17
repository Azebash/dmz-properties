import { describe, expect, it } from "vitest";
import { articles, properties } from "../src/lib/content";

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
