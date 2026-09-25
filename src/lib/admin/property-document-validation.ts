export const maxPropertyDocumentBytes = 3 * 1024 * 1024;

export const documentTypes = ["offer_letter", "title_document", "survey_plan", "other"] as const;

export function parseDocumentDetails(formData: FormData) {
  const type = String(formData.get("documentType") || "");
  const name = String(formData.get("displayName") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!documentTypes.some((option) => option === type) || name.length < 5 || name.length > 120 || notes.length > 500) {
    return { success: false as const, error: "Choose a document type, a name of 5–120 characters, and notes under 500 characters." };
  }
  return { success: true as const, details: { type, name, notes } };
}

export function isReadablePdf(bytes: Uint8Array) {
  if (bytes.length < 16 || bytes.length > maxPropertyDocumentBytes) return false;
  const header = Buffer.from(bytes.subarray(0, 8)).toString("ascii");
  const tail = Buffer.from(bytes.subarray(-1024)).toString("latin1");
  return /^%PDF-[12]\./.test(header) && tail.includes("%%EOF");
}
