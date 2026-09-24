"use server";

import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { maxPropertyImageBytes, parseMediaDetails } from "@/lib/admin/property-media-validation";
import { normalizePropertyImage } from "@/lib/admin/normalize-property-image";
import { revalidatePublicProperty } from "@/lib/admin/property-revalidation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";

export type MediaActionState = { error: string; message: string };
type Status = Database["public"]["Enums"]["verification_status"];

async function requirePropertyStaff() {
  const staff = await requireStaff();
  return staff.role === "administrator" || staff.role === "property_manager";
}

async function cleanupFailedUpload(path: string) {
  const bucket = createServiceClient().storage.from("property-media");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { error } = await bucket.remove([path]);
      if (!error) return true;
    } catch {
      // Retry once; the file remains private if Storage is temporarily unavailable.
    }
  }
  console.error(JSON.stringify({ level: "error", event: "property_media_orphan_cleanup_failed", path }));
  return false;
}

function adminPath(id: string) {
  return `/admin/properties/${id}/edit`;
}

export async function uploadPropertyImage(
  _state: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  if (!await requirePropertyStaff()) return { error: "Your role cannot upload property photos.", message: "" };
  const propertyId = String(formData.get("propertyId") || "");
  const image = formData.get("image");
  if (!uuidPattern.test(propertyId) || !image || typeof image === "string" ||
    image.size < 12 || image.size > maxPropertyImageBytes) {
    return { error: "Select a JPEG, PNG, or WebP image smaller than 3 MB.", message: "" };
  }
  const supabase = await createClient();
  const { data: property, error: propertyError } = await supabase.from("properties")
    .select("id,property_type").eq("id", propertyId).maybeSingle();
  if (propertyError || !property) return { error: "Property not found.", message: "" };
  const details = parseMediaDetails(formData, property.property_type);
  if (!details.success) return { error: details.error, message: "" };

  const bytes = Buffer.from(await image.arrayBuffer());
  const normalized = await normalizePropertyImage(image.type, bytes);
  if (!normalized) {
    return { error: "The file must be a fully readable JPEG, PNG, or WebP image.", message: "" };
  }
  const storagePath = `${propertyId}/${randomUUID()}.webp`;
  const service = createServiceClient();
  try {
    const { error: uploadError } = await service.storage.from("property-media")
      .upload(storagePath, normalized, { contentType: "image/webp", upsert: false });
    if (uploadError) throw uploadError;
  } catch {
    await cleanupFailedUpload(storagePath);
    return { error: "The private photo upload did not complete.", message: "" };
  }

  let registered = false;
  try {
    const { error } = await supabase.rpc("add_property_media", {
      p_property_id: propertyId,
      p_storage_path: storagePath,
      p_alt_text: details.alt,
      p_caption: details.caption,
      p_estate_context: details.estateContext,
    });
    registered = !error;
  } catch {
    // An interrupted response does not prove whether the database committed.
  }
  if (!registered) {
    try {
      const { data: existing, error: lookupError } = await service.from("property_media")
        .select("id").eq("storage_path", storagePath).maybeSingle();
      if (existing) registered = true;
      else if (lookupError) throw lookupError;
    } catch {
      console.error(JSON.stringify({ level: "error", event: "property_media_registration_unknown", path: storagePath }));
      return { error: "The private upload needs staff review before retrying.", message: "" };
    }
  }
  if (!registered) {
    const cleaned = await cleanupFailedUpload(storagePath);
    return {
      error: cleaned ? "The uploaded photo could not be registered for review."
        : "The private upload needs staff cleanup. Contact an administrator.",
      message: "",
    };
  }
  revalidatePath(adminPath(propertyId));
  return { error: "", message: "Image uploaded privately. Review and approve it before public display." };
}

export async function updatePropertyImage(
  _state: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  if (!await requirePropertyStaff()) return { error: "Your role cannot edit property photos.", message: "" };
  const id = String(formData.get("mediaId") || "");
  const sortOrder = Number(formData.get("sortOrder"));
  if (!uuidPattern.test(id) || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
    return { error: "Choose a valid image and display order.", message: "" };
  }
  const supabase = await createClient();
  const { data: media } = await supabase.from("property_media")
    .select("property_id,properties!inner(property_type,slug)").eq("id", id).maybeSingle();
  if (!media) return { error: "Property image not found.", message: "" };
  const details = parseMediaDetails(formData, media.properties.property_type);
  if (!details.success) return { error: details.error, message: "" };
  const { error } = await supabase.rpc("update_property_media", {
    p_media_id: id,
    p_alt_text: details.alt,
    p_caption: details.caption,
    p_estate_context: details.estateContext,
    p_sort_order: sortOrder,
  });
  if (error) return { error: "Image changes could not be saved.", message: "" };
  revalidatePublicProperty([media.properties.slug]);
  revalidatePath(adminPath(media.property_id));
  return { error: "", message: "Image details saved and audited. Content edits require renewed approval." };
}

export async function transitionPropertyImage(
  _state: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  if (!await requirePropertyStaff()) return { error: "Your role cannot approve property photos.", message: "" };
  const id = String(formData.get("mediaId") || "");
  const status = String(formData.get("status") || "") as Status;
  if (!uuidPattern.test(id) || !["submitted", "approved", "rejected", "withdrawn"].includes(status)) {
    return { error: "Choose a valid media transition.", message: "" };
  }
  const confirmed = formData.get("rightsConfirmed") === "confirmed";
  if (status === "approved" && !confirmed) {
    return { error: "Confirm image rights and classification before approving.", message: "" };
  }
  const supabase = await createClient();
  const { data: media } = await supabase.from("property_media")
    .select("property_id,properties!inner(slug)").eq("id", id).maybeSingle();
  if (!media) return { error: "Property image not found.", message: "" };
  const { error } = await supabase.rpc("transition_property_media", {
    p_media_id: id, p_status: status, p_rights_confirmed: confirmed,
  });
  if (error) return { error: "The image could not move to that stage.", message: "" };
  revalidatePublicProperty([media.properties.slug]);
  revalidatePath(adminPath(media.property_id));
  return { error: "", message: `Image moved to ${status} and audited.` };
}
