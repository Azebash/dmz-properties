"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PropertyStatus } from "@/lib/supabase/types";
import { requireStaff } from "@/lib/admin/auth";
import { propertyPayloadFromFormData } from "@/lib/admin/property-validation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublicProperty } from "@/lib/admin/property-revalidation";

export type PropertyActionState = { error: string };

function canManage(role: string) {
  return role === "administrator" || role === "property_manager";
}

export async function savePropertyAction(
  _state: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const staff = await requireStaff();
  if (!canManage(staff.role)) return { error: "Your role cannot edit properties." };

  const parsed = propertyPayloadFromFormData(formData);
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const previousId = String(formData.get("id") || "");
  const previous = previousId ? await supabase.from("properties")
    .select("slug").eq("id", previousId).maybeSingle() : null;
  const { data, error } = await supabase.rpc("save_property", {
    p_payload: parsed.payload,
  });
  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "That property reference or URL slug already exists." };
    }
    if (error?.code === "23514") {
      return { error: "Published properties need a verification date and fixed URL/reference. Check the listing details." };
    }
    return { error: "The property could not be saved." };
  }

  const { data: current } = await supabase.from("properties")
    .select("slug").eq("id", data).maybeSingle();
  revalidatePublicProperty([previous?.data?.slug || "", current?.slug || ""]);
  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  redirect(`/admin/properties/${data}/edit?saved=1`);
}

export async function transitionPropertyAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canManage(staff.role)) redirect("/admin/access-denied");

  const propertyId = String(formData.get("propertyId") || "");
  const status = String(formData.get("status") || "") as PropertyStatus;
  const allowed: PropertyStatus[] = [
    "draft",
    "under_review",
    "published",
    "reserved",
    "sold",
    "archived",
  ];
  if (!propertyId || !allowed.includes(status)) {
    redirect(`/admin/properties/${propertyId}/edit?transition=invalid`);
  }

  const supabase = await createClient();
  const { data: propertyBefore } = await supabase.from("properties")
    .select("slug").eq("id", propertyId).maybeSingle();
  const { error } = await supabase.rpc("transition_property_status", {
    p_property_id: propertyId,
    p_status: status,
  });
  if (!error) {
    revalidatePublicProperty([propertyBefore?.slug || ""]);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}/edit`);
  redirect(
    `/admin/properties/${propertyId}/edit?transition=${error ? "failed" : "saved"}`,
  );
}
