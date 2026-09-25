import { describe, expect, it } from "vitest";
import { isReadablePdf, maxPropertyDocumentBytes, parseDocumentDetails } from "@/lib/admin/property-document-validation";

function details(type = "offer_letter", name = "Private offer letter", notes = "Internal only") {
  const form = new FormData();
  form.set("documentType", type);
  form.set("displayName", name);
  form.set("notes", notes);
  return form;
}

describe("private property document validation", () => {
  it("requires a known category and a useful internal name", () => {
    expect(parseDocumentDetails(details()).success).toBe(true);
    expect(parseDocumentDetails(details("unknown")).success).toBe(false);
    expect(parseDocumentDetails(details("offer_letter", "Hi")).success).toBe(false);
    expect(parseDocumentDetails(details("offer_letter", "Private offer letter", "x".repeat(501))).success).toBe(false);
  });

  it("rejects a disguised or oversized document before private storage", () => {
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\n%%EOF");
    expect(isReadablePdf(pdf)).toBe(true);
    expect(isReadablePdf(Buffer.from("<html>not a PDF</html>%%EOF"))).toBe(false);
    expect(isReadablePdf(Buffer.from("%PDF-1.7\nno trailer"))).toBe(false);
    expect(isReadablePdf(Buffer.alloc(maxPropertyDocumentBytes + 1))).toBe(false);
  });
});
