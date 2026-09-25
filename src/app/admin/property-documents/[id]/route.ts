import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/property-documents/[id]">,
) {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    return new Response(null, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  const { id } = await params;
  if (!uuidPattern.test(id)) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("property_documents")
    .select("storage_path").eq("id", id).maybeSingle();
  if (error) return new Response(null, { status: 503 });
  if (!data || !data.storage_path.endsWith(".pdf")) return new Response(null, { status: 404 });
  const { data: file, error: downloadError } = await createServiceClient().storage
    .from("property-documents").download(data.storage_path);
  if (downloadError || !file) return new Response(null, { status: 404 });
  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="property-document-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
