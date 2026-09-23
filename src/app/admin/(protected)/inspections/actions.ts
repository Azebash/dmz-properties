"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import {
  inspectionNextStatuses,
  uuidPattern,
  type InspectionStatus,
} from "@/lib/admin/lead-workflow";
import { createClient } from "@/lib/supabase/server";

export type InspectionActionState = { error: string; message: string };

async function requireManager() {
  const staff = await requireStaff();
  return staff.role === "administrator" || staff.role === "property_manager";
}

export async function updateInspectionAction(
  _previous: InspectionActionState,
  formData: FormData,
): Promise<InspectionActionState> {
  if (!(await requireManager())) {
    return { error: "Your role cannot manage inspections.", message: "" };
  }

  const id = String(formData.get("inspectionId") || "");
  const status = String(formData.get("status") || "") as InspectionStatus;
  const scheduledLocal = String(formData.get("scheduledLocal") || "");
  const outcomeNotes = String(formData.get("outcomeNotes") || "").trim();
  if (!uuidPattern.test(id) || !Object.hasOwn(inspectionNextStatuses, status) || outcomeNotes.length > 5000) {
    return { error: "Check the inspection details before saving.", message: "" };
  }
  if (status === "confirmed" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledLocal)) {
    return { error: "Select a local date and time to confirm the inspection.", message: "" };
  }
  if (status === "completed" && outcomeNotes.length < 10) {
    return { error: "Record the inspection outcome before completing it.", message: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_inspection_workflow", {
    p_inspection_id: id,
    p_status: status,
    p_scheduled_local: scheduledLocal,
    p_outcome_notes: outcomeNotes,
  });
  if (error) {
    return {
      error:
        error.code === "23514"
          ? "The date, time zone, or status transition is not valid. Review the details and try again."
          : "The inspection could not be updated. Please try again.",
      message: "",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inspections");
  revalidatePath(`/admin/inspections/${id}`);
  return { error: "", message: "Inspection updated and recorded in the audit history." };
}

export async function updateInspectionTimezoneAction(
  _previous: InspectionActionState,
  formData: FormData,
): Promise<InspectionActionState> {
  if (!(await requireManager())) {
    return { error: "Your role cannot manage inspections.", message: "" };
  }

  const id = String(formData.get("inspectionId") || "");
  const timeZone = String(formData.get("timeZone") || "").trim();
  if (!uuidPattern.test(id) || timeZone.length > 100 || !timeZone) {
    return { error: "Enter a valid IANA time zone.", message: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_inspection_timezone", {
    p_inspection_id: id,
    p_time_zone: timeZone,
  });
  if (error) {
    return {
      error:
        error.code === "23514"
          ? "This time zone is not recognized. Try an IANA value such as Africa/Lagos or Europe/London."
          : "The time zone could not be updated.",
      message: "",
    };
  }

  revalidatePath(`/admin/inspections/${id}`);
  return { error: "", message: "Time zone updated and audited." };
}
