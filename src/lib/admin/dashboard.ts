import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin/auth";
import { followUpStatuses, lagosToday } from "@/lib/admin/follow-ups";

async function countRows(table: "properties" | "enquiries" | "inspections" | "seller_submissions") {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Unable to count ${table}: ${error.message}`);
  return count || 0;
}

export async function getAdminSummary() {
  const staff = await requireStaff();
  const canViewLeads = staff.role === "administrator" || staff.role === "property_manager";
  const properties = await countRows("properties");
  const [enquiries, inspections, sellerSubmissions, dueFollowUps] = canViewLeads
    ? await Promise.all([
      countRows("enquiries"), countRows("inspections"), countRows("seller_submissions"),
      (async () => {
        const supabase = await createClient();
        const { count, error } = await supabase.from("enquiries")
          .select("id", { count: "exact", head: true })
          .in("status", followUpStatuses).lte("follow_up_on", lagosToday());
        if (error) throw new Error(`Unable to count due follow-ups: ${error.message}`);
        return count || 0;
      })(),
    ])
    : [null, null, null, null];

  return { properties, enquiries, inspections, sellerSubmissions, dueFollowUps };
}
