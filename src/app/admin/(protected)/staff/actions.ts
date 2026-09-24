"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";

type StaffRole = Database["public"]["Enums"]["staff_role"];
export type StaffActionState = { error: string; message: string };
const roles: StaffRole[] = ["administrator", "property_manager", "content_editor", "viewer"];

function roleFromForm(formData: FormData): StaffRole | null {
  const role = String(formData.get("role") || "");
  return roles.includes(role as StaffRole) ? role as StaffRole : null;
}

async function requireAdministrator() {
  const staff = await requireStaff();
  if (staff.role !== "administrator") redirect("/admin/access-denied");
}

async function authAccountIsUsable(userId: string) {
  const { data, error } = await createServiceClient().auth.admin.getUserById(userId);
  if (error || !data.user?.email_confirmed_at) return false;
  const bannedUntil = Date.parse(data.user.banned_until || "");
  return Number.isNaN(bannedUntil) || bannedUntil <= Date.now();
}

export async function registerExistingStaffAction(
  _state: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdministrator();
  const userId = String(formData.get("userId") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();
  const role = roleFromForm(formData);
  if (!uuidPattern.test(userId) || !role || displayName.length < 2 || displayName.length > 120) {
    return { error: "Enter an existing Auth user ID, staff name, and role.", message: "" };
  }
  if (!await authAccountIsUsable(userId)) {
    return { error: "The Auth user must have a confirmed email and must not be banned.", message: "" };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_staff_profile", {
    p_user_id: userId,
    p_display_name: displayName,
    p_role: role,
    p_active: true,
  });
  if (error) return { error: "Access could not be assigned. Confirm that the Auth user exists.", message: "" };
  revalidatePath("/admin/staff");
  return { error: "", message: "Existing Auth user granted audited staff access." };
}

export async function updateStaffAction(
  _state: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdministrator();
  const userId = String(formData.get("userId") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const role = roleFromForm(formData);
  const active = String(formData.get("active")) === "true";
  if (!uuidPattern.test(userId) || !role || displayName.length < 2 || displayName.length > 120) {
    return { error: "Enter a valid staff name and role.", message: "" };
  }
  if (active && !await authAccountIsUsable(userId)) {
    return { error: "The Auth user must have a confirmed email and must not be banned.", message: "" };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_staff_profile", {
    p_user_id: userId,
    p_display_name: displayName,
    p_role: role,
    p_active: active,
  });
  if (error) {
    return {
      error: error.code === "23514"
        ? "This change would remove essential access or leave assigned work without an owner. Reassign work first."
        : "Staff access could not be updated.",
      message: "",
    };
  }
  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${userId}`);
  return { error: "", message: "Staff access updated and audited." };
}

export async function assignLeadAction(
  _state: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdministrator();
  const enquiryId = String(formData.get("enquiryId") || "");
  const assignee = String(formData.get("assignee") || "");
  if (!uuidPattern.test(enquiryId) || (assignee && !uuidPattern.test(assignee))) {
    return { error: "Select a valid staff member.", message: "" };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_enquiry_staff", {
    p_enquiry_id: enquiryId,
    p_assignee: assignee || null,
  });
  if (error) return { error: "Assignment failed. Choose an active property manager or administrator.", message: "" };
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath("/admin/inspections");
  return { error: "", message: "Lead and linked inspection ownership updated." };
}
