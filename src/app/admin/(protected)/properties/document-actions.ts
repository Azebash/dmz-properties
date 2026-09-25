"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { isReadablePdf, maxPropertyDocumentBytes, parseDocumentDetails } from "@/lib/admin/property-document-validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";

export type DocumentActionState = { error: string; message: string };
type Status = Database["public"]["Enums"]["verification_status"];

async function isPropertyStaff() {
  const staff = await requireStaff();
  return staff.role === "administrator" || staff.role === "property_manager";
}

function adminPath(id: string) {
  return `/admin/properties/${id}/edit`;
}

async function cleanupFailedUpload(path: string) {
  const bucket = createServiceClient().storage.from("property-documents");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { error } = await bucket.remove([path]);
      if (!error) return true;
    } catch {
      // A failed cleanup does not make a private document public.
    }
  }
  console.error(JSON.stringify({ level: "error", event: "property_document_orphan_cleanup_failed", path }));
  return false;
}

export async function uploadPropertyDocument(
  _state: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  if (!await isPropertyStaff()) return { error: "Your role cannot upload property documents.", message: "" };
  const propertyId = String(formData.get("propertyId") || "");
  const document = formData.get("document");
  if (!uuidPattern.test(propertyId) || !document || typeof document === "string" ||
    document.size < 16 || document.size > maxPropertyDocumentBytes || document.type !== "application/pdf") {
    return { error: "Select a PDF document smaller than 3 MB.", message: "" };
  }
  const details = parseDocumentDetails(formData);
  if (!details.success) return { error: details.error, message: "" };
  const supabase = await createClient();
  const { data: property, error: propertyError } = await supabase.from("properties")
    .select("id").eq("id", propertyId).maybeSingle();
  if (propertyError || !property) return { error: "Property not found.", message: "" };
  const bytes = new Uint8Array(await document.arrayBuffer());
  if (!isReadablePdf(bytes)) return { error: "The document must be a readable PDF file.", message: "" };

  const storagePath = `${propertyId}/${randomUUID()}.pdf`;
  const service = createServiceClient();
  try {
    const { error } = await service.storage.from("property-documents")
      .upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
    if (error) throw error;
  } catch {
    return { error: "The private document upload did not complete.", message: "" };
  }

  let registered = false;
  try {
    const { error } = await supabase.rpc("add_property_document", {
      p_property_id: propertyId, p_storage_path: storagePath,
      p_document_type: details.details.type, p_display_name: details.details.name,
      p_notes: details.details.notes,
    });
    registered = !error;
  } catch {
    // An interrupted response does not prove whether the transaction committed.
  }
  if (!registered) {
    try {
      const { data: existing, error } = await service.from("property_documents")
        .select("id").eq("storage_path", storagePath).maybeSingle();
      if (existing) registered = true;
      else if (error) throw error;
    } catch {
      console.error(JSON.stringify({ level: "error", event: "property_document_registration_unknown", path: storagePath }));
      return { error: "The private upload needs staff review before retrying.", message: "" };
    }
  }
  if (!registered) {
    const cleaned = await cleanupFailedUpload(storagePath);
    return { error: cleaned ? "The document could not be registered for review."
      : "The private upload needs staff cleanup. Contact an administrator.", message: "" };
  }
  revalidatePath(adminPath(propertyId));
  return { error: "", message: "Document uploaded privately for internal review." };
}

export async function updatePropertyDocument(
  _state: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  if (!await isPropertyStaff()) return { error: "Your role cannot edit property documents.", message: "" };
  const id = String(formData.get("documentId") || "");
  if (!uuidPattern.test(id)) return { error: "Choose a valid document.", message: "" };
  const details = parseDocumentDetails(formData);
  if (!details.success) return { error: details.error, message: "" };
  const supabase = await createClient();
  const { data } = await supabase.from("property_documents").select("property_id").eq("id", id).maybeSingle();
  if (!data) return { error: "Property document not found.", message: "" };
  const { error } = await supabase.rpc("update_property_document", {
    p_document_id: id, p_document_type: details.details.type,
    p_display_name: details.details.name, p_notes: details.details.notes,
  });
  if (error) return { error: "Document details could not be saved.", message: "" };
  revalidatePath(adminPath(data.property_id));
  return { error: "", message: "Document details saved. Edits to reviewed documents require a new review." };
}

export async function transitionPropertyDocument(
  _state: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  if (!await isPropertyStaff()) return { error: "Your role cannot review property documents.", message: "" };
  const id = String(formData.get("documentId") || "");
  const status = String(formData.get("status") || "") as Status;
  if (!uuidPattern.test(id) || !["submitted", "approved", "rejected", "withdrawn"].includes(status)) {
    return { error: "Choose a valid document transition.", message: "" };
  }
  const confirmed = formData.get("reviewConfirmed") === "confirmed";
  if (status === "approved" && !confirmed) {
    return { error: "Confirm you inspected the document before marking it verified.", message: "" };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("property_documents").select("property_id").eq("id", id).maybeSingle();
  if (!data) return { error: "Property document not found.", message: "" };
  const { error } = await supabase.rpc("transition_property_document", {
    p_document_id: id, p_status: status, p_review_confirmed: confirmed,
  });
  if (error) return { error: "The document could not move to that stage.", message: "" };
  revalidatePath(adminPath(data.property_id));
  return { error: "", message: `Document moved to ${status} and audited. It remains private.` };
}
