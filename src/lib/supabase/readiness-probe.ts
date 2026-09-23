import "server-only";

import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export async function isSupabaseReachable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { url, publishableKey } = getSupabaseConfig();
    const endpoint = new URL("/rest/v1/articles?select=id&status=eq.published&limit=1", url);
    const response = await fetch(endpoint, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok && Array.isArray(await response.json());
  } catch {
    return false;
  }
}
