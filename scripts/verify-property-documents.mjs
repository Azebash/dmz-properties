import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const production = process.argv.includes("--production");
const site = production ? "https://dmz-properties.vercel.app"
  : process.env.DMZ_VERIFY_SITE_URL || "http://localhost:3100";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
if ((!production && !site.startsWith("http://localhost:")) || !url || !secret || !email || !password) {
  throw new Error("Use a local production build or explicit --production mode with linked staff credentials");
}

function samplePdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let body = "%PDF-1.7\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  return Buffer.from(`${body}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}

const service = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const name = `Private document verification ${Date.now()}`;
let documentId;
let storagePath;
let browser;
try {
  const { data: property, error } = await service.from("properties")
    .select("id,slug,status").eq("reference", "DMZ-KYC-001").single();
  if (error || !property || property.status !== "published") {
    throw new Error("The existing developer listing is unavailable for reversible document verification");
  }
  browser = await chromium.launch({ headless: true });
  const admin = await browser.newPage();
  const reader = await browser.newPage();
  await admin.goto(`${site}/admin/login`);
  await admin.getByLabel("Staff email").fill(email);
  await admin.getByLabel("Password").fill(password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });
  await admin.goto(`${site}/admin/properties/${property.id}/edit`);
  await expect(admin.getByRole("heading", { name: "Private property documents" })).toBeVisible();
  await admin.setViewportSize({ width: 375, height: 812 });
  const mobileWidth = await admin.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  if (mobileWidth.content > mobileWidth.viewport + 1) {
    throw new Error("Private document editor overflows a 375px viewport");
  }
  await admin.setViewportSize({ width: 1280, height: 800 });
  const pdf = samplePdf();
  await admin.getByLabel("PDF document (maximum 3 MB)").setInputFiles({
    name: "verification.pdf", mimeType: "application/pdf", buffer: pdf,
  });
  await admin.getByLabel("Internal document name").first().fill(name);
  await admin.getByRole("button", { name: "Upload privately" }).click();
  await expect(admin.getByText("Document uploaded privately for internal review.")).toBeVisible({ timeout: 30_000 });

  const { data: documents, error: documentError } = await service.from("property_documents")
    .select("id,storage_path,verification_status").eq("property_id", property.id).eq("display_name", name);
  if (documentError || documents.length !== 1 || documents[0].verification_status !== "submitted") {
    throw new Error("The uploaded document did not create one private review record");
  }
  documentId = documents[0].id;
  storagePath = documents[0].storage_path;
  const downloadUrl = `${site}/admin/property-documents/${documentId}`;
  await reader.goto(downloadUrl);
  await expect(reader).toHaveURL(/\/admin\/login/);
  const response = await admin.request.get(downloadUrl);
  if (response.status() !== 200 || response.headers()["content-type"] !== "application/pdf"
    || !response.headers()["content-disposition"]?.startsWith("attachment;")
    || !response.headers()["cache-control"]?.includes("no-store")
    || !Buffer.from(await response.body()).equals(pdf)) {
    throw new Error("Private document download was unavailable or did not preserve the PDF bytes");
  }
  const publicHtml = await (await fetch(`${site}/properties/${property.slug}`)).text();
  if (publicHtml.includes(name) || publicHtml.includes(downloadUrl)) {
    throw new Error("Private document details leaked into the public listing");
  }

  await admin.getByRole("button", { name: "Mark internally verified" }).click();
  await expect(admin.getByText("Confirm you inspected the document before marking it verified.")).toBeVisible();
  await admin.getByRole("checkbox", { name: /inspected this private document/i }).check();
  await admin.getByRole("button", { name: "Mark internally verified" }).click();
  await expect(admin.getByText("Document moved to approved and audited. It remains private.")).toBeVisible({ timeout: 30_000 });
  await reader.goto(downloadUrl);
  await expect(reader).toHaveURL(/\/admin\/login/);
  await admin.getByLabel("Private notes (optional)").last().fill("Reviewed fixture only");
  await admin.getByRole("button", { name: "Save document details" }).click();
  await expect(admin.getByText("Document details saved. Edits to reviewed documents require a new review.")).toBeVisible();
  await admin.getByRole("checkbox", { name: /inspected this private document/i }).check();
  await admin.getByRole("button", { name: "Mark internally verified" }).click();
  await expect(admin.getByText("Document moved to approved and audited. It remains private.")).toBeVisible();
  await admin.getByRole("button", { name: "Withdraw document" }).click();
  await expect(admin.getByText("Document moved to withdrawn and audited. It remains private.")).toBeVisible();
  console.log("Private PDF upload, staff download, review, re-review and withdrawal passed");
} finally {
  await browser?.close();
  if (!documentId) {
    const { data: remaining } = await service.from("property_documents")
      .select("id,storage_path").eq("display_name", name);
    documentId = remaining?.[0]?.id;
    storagePath = remaining?.[0]?.storage_path;
  }
  if (documentId) {
    const { error: auditError } = await service.from("audit_events").delete()
      .eq("entity_type", "property_document").eq("entity_id", documentId);
    if (auditError) throw new Error("Temporary document audit history could not be removed");
    const { error: rowError } = await service.from("property_documents").delete().eq("id", documentId);
    if (rowError) throw new Error("Temporary document metadata could not be removed");
  }
  if (storagePath) {
    const { error: storageError } = await service.storage.from("property-documents").remove([storagePath]);
    if (storageError) throw new Error("Temporary private document file could not be removed");
    const { data: leftover } = await service.storage.from("property-documents").download(storagePath);
    if (leftover) throw new Error("Temporary private document file was still present");
    console.log("Temporary document, metadata and audit records removed");
  }
}
