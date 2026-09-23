import type { MetadataRoute } from "next";
import { categorySlug, properties } from "@/lib/content";
import { getPublishedArticles } from "@/lib/public-articles";
import { siteUrl } from "@/lib/site";

// Generated XML must reflect new publications without a stale prerendered CDN copy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();
  const articleCategories = [...new Set(articles.map((article) => article.category))];
  const routes = [
    "",
    "/properties",
    "/areas/kyc-homes-phase-ii",
    "/sell",
    "/verification",
    "/buying-from-abroad",
    "/faqs",
    "/privacy",
    "/terms",
    "/payment-safety",
    "/guides/kyc-homes-phase-ii-buyer-guide",
    "/gallery",
    "/insights",
    "/about",
    "/contact",
    "/book-inspection",
  ];

  return [
    ...routes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
    })),
    ...properties.map((property) => ({
      url: `${siteUrl}/properties/${property.slug}`,
      lastModified: new Date(property.updatedAt),
    })),
    ...articles.map((article) => ({
      url: `${siteUrl}/insights/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    })),
    ...articleCategories.map((category) => ({
      url: `${siteUrl}/insights/topics/${categorySlug(category)}`,
      lastModified: new Date(),
    })),
  ];
}
