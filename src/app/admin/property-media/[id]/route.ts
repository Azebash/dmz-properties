import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { createClient } from "@/lib/supabase/server";
import { deliverPropertyMedia } from "@/lib/property-media-delivery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/property-media/[id]">,
) {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    return new Response(null, { status: 403 });
  }
  const { id } = await params;
  if (!uuidPattern.test(id)) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("property_media")
    .select("storage_path,media_type").eq("id", id).maybeSingle();
  if (error) return new Response(null, { status: 503 });
  if (!data || data.media_type !== "image") return new Response(null, { status: 404 });
  return deliverPropertyMedia(data.storage_path);
}
