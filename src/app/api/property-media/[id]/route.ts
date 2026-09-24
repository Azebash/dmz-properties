import { getSupabaseConfig } from "@/lib/supabase/config";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { deliverPropertyMedia } from "@/lib/property-media-delivery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/property-media/[id]">,
) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return new Response(null, { status: 404 });
  try {
    const { url, publishableKey } = getSupabaseConfig();
    const endpoint = new URL("/rest/v1/property_media", url);
    endpoint.searchParams.set("select", "storage_path,media_type");
    endpoint.searchParams.set("id", `eq.${id}`);
    endpoint.searchParams.set("limit", "1");
    const response = await fetch(endpoint, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return new Response(null, { status: 503 });
    const media = await response.json() as { storage_path: string; media_type: string }[];
    if (!media.length || media[0].media_type !== "image") {
      return new Response(null, { status: 404 });
    }
    return deliverPropertyMedia(media[0].storage_path);
  } catch {
    return new Response(null, { status: 503 });
  }
}
