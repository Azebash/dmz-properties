import "server-only";

import { areaGuideSlug, parseAreaGuideCopy, repositoryAreaGuideCopy } from "@/lib/area-guide-copy";
import { usesDatabaseContent } from "@/lib/public-articles";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function getPublicAreaGuide() {
  if (!usesDatabaseContent()) return repositoryAreaGuideCopy;
  const { url, publishableKey } = getSupabaseConfig();
  const response = await fetch(new URL("/rest/v1/rpc/get_published_area_guide", url), {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_slug: areaGuideSlug }),
    next: { revalidate: 60, tags: ["published-area-guide"] },
  });
  if (!response.ok) throw new Error("Published area guide is unavailable");
  return parseAreaGuideCopy(await response.json());
}
