import "server-only";

import { revalidatePath, updateTag } from "next/cache";

export function revalidatePublicProperty(slugs: string[]) {
  updateTag("published-properties");
  const routes = new Set([
    "/", "/properties", "/areas/kyc-homes-phase-ii", "/faqs",
    "/guides/kyc-homes-phase-ii-buyer-guide", "/sitemap.xml",
    ...slugs.filter(Boolean).map((slug) => `/properties/${slug}`),
  ]);
  for (const route of routes) revalidatePath(route);
}
