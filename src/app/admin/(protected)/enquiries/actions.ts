"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import {
  enquiryNextStatuses,
  uuidPattern,
  type EnquiryStatus,
} from "@/lib/admin/lead-workflow";
import { createClient } from "@/lib/supabase/server";

export type EnquiryActionState = { error: string; message: string };

export async function updateEnquiryAction(
  _previous: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    return { error: "Your role cannot manage enquiries.", message: "" };
  }

  const id = String(formData.get("enquiryId") || "");
  const status = String(formData.get("status") || "") as EnquiryStatus;
  const notes = String(formData.get("notes") || "").trim();
  if (!uuidPattern.test(id) || !Object.hasOwn(enquiryNextStatuses, status) || notes.length > 5000) {
    return { error: "Check the enquiry status and notes before saving.", message: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_enquiry_workflow", {
    p_enquiry_id: id,
    p_status: status,
    p_notes: notes,
  });
  if (error) {
    return {
      error:
        error.code === "23514"
          ? "That change is not allowed from the current enquiry stage."
          : "The enquiry could not be updated. Please try again.",
      message: "",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  return { error: "", message: "Enquiry updated and recorded in the audit history." };
}
