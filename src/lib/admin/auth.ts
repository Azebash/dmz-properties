import { cache } from "react";
import { redirect } from "next/navigation";
import type { StaffProfileRow } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const requireStaff = cache(async (): Promise<StaffProfileRow> => {
  if (!isSupabaseConfigured()) redirect("/admin/login?setup=required");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") redirect("/admin/login");

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("user_id, display_name, role, active, created_at, updated_at")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (profileError || !profile) redirect("/admin/access-denied");
  return profile;
});
