"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { createClient } from "@/lib/supabase/server";

export type FollowUpActionState = { error: string; message: string };

export async function saveEnquiryFollowUp(
  _state: FollowUpActionState, formData: FormData,
): Promise<FollowUpActionState> {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    return { error: "Your role cannot schedule lead follow-ups.", message: "" };
  }
  const id = String(formData.get("enquiryId") || "");
  const date = formData.get("clear") === "yes" ? null : String(formData.get("followUpOn") || "");
  if (!uuidPattern.test(id) || (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return { error: "Choose a valid follow-up date or clear the reminder.", message: "" };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_enquiry_follow_up", {
    p_enquiry_id: id, p_follow_up_on: date,
  });
  if (error) return { error: error.code === "23514"
    ? "Follow-ups must be within the next year and belong to an active enquiry."
    : "The follow-up date could not be saved.", message: "" };
  revalidatePath("/admin");
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  return { error: "", message: date === null
    ? "Follow-up cleared and audited." : "Follow-up scheduled and audited. Check the staff inbox for due reminders." };
}
