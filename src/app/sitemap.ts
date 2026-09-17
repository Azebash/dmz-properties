import type { MetadataRoute } from "next";
import { articles, properties } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
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
    "/insights",
    "/about",
    "/contact",
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
  ];
}
