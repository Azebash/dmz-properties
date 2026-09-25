"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { revalidatePublicProperty } from "@/lib/admin/property-revalidation";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityActionState = { error: string; message: string };

export async function updatePropertyAvailability(
  _state: AvailabilityActionState, formData: FormData,
): Promise<AvailabilityActionState> {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    return { error: "Your role cannot check property availability.", message: "" };
  }
  const id = String(formData.get("propertyId") || "");
  const status = String(formData.get("availability") || "");
  if (!uuidPattern.test(id) || !["unconfirmed", "available", "on_hold"].includes(status)) {
    return { error: "Choose a valid property and availability status.", message: "" };
  }
  const checked = formData.get("checked") === "confirmed";
  if (status !== "unconfirmed" && !checked) {
    return { error: "Confirm that you checked current inventory with the developer or owner.", message: "" };
  }
  const supabase = await createClient();
  const { data: property, error: lookupError } = await supabase.from("properties")
    .select("slug,status").eq("id", id).maybeSingle();
  if (lookupError || !property || property.status !== "published") {
    return { error: "Only published properties can have a current availability check.", message: "" };
  }
  const { error } = await supabase.rpc("set_property_availability", {
    p_property_id: id, p_status: status, p_checked: checked,
  });
  if (error) return { error: "Availability could not be updated. Recheck the current listing status.", message: "" };
  revalidatePublicProperty([property.slug]);
  revalidatePath(`/admin/properties/${id}/edit`);
  return { error: "", message: status === "unconfirmed"
    ? "Availability reset to needs confirmation and audited."
    : "Availability check saved and audited. Reconfirm before payment." };
}
