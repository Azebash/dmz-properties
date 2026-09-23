"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { areaGuideCopyFromForm, areaGuideSlug } from "@/lib/area-guide-copy";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const editorPath = "/admin/areas/kyc-homes-phase-ii";
const publicPath = "/areas/kyc-homes-phase-ii";

function canEdit(role: string) {
  return role === "administrator" || role === "content_editor";
}

export async function saveAreaGuideAction(_previous: { error: string }, formData: FormData) {
  const staff = await requireStaff();
  if (!canEdit(staff.role)) return { error: "Your role cannot edit area guides." };
  let copy;
  try {
    copy = areaGuideCopyFromForm(formData);
  } catch {
    return { error: "Every field needs between 10 and 400 characters of approved copy." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_area_guide", { p_slug: areaGuideSlug, p_copy: copy });
  if (error) return { error: "The area guide could not be saved. Please try again." };
  revalidatePath(editorPath);
  redirect(`${editorPath}?saved=1`);
}

export async function transitionAreaGuideAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canEdit(staff.role)) redirect("/admin/access-denied");
  const status = String(formData.get("status") || "");
  if (status !== "draft" && status !== "under_review" && status !== "published") {
    redirect(editorPath);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_area_guide_status", {
    p_slug: areaGuideSlug, p_status: status,
  });
  if (!error && status === "published") {
    updateTag("published-area-guide");
    revalidatePath(publicPath);
  }
  revalidatePath(editorPath);
  redirect(`${editorPath}?transition=${error ? "failed" : "saved"}`);
}
