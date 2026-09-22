import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin/auth";

async function countRows(table: "properties" | "enquiries" | "inspections" | "seller_submissions") {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Unable to count ${table}: ${error.message}`);
  return count || 0;
}

export async function getAdminSummary() {
  await requireStaff();
  const [properties, enquiries, inspections, sellerSubmissions] = await Promise.all([
    countRows("properties"),
    countRows("enquiries"),
    countRows("inspections"),
    countRows("seller_submissions"),
  ]);

  return { properties, enquiries, inspections, sellerSubmissions };
}
