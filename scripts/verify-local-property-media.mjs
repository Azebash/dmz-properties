import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const production = process.argv.includes("--production");
const site = production
  ? "https://dmz-properties.vercel.app"
  : process.env.DMZ_VERIFY_SITE_URL || "http://localhost:3100";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
if ((!production && !site.startsWith("http://localhost:")) || !url || !secret || !email || !password) {
  throw new Error("Use the local production build or the explicit --production mode with linked Supabase credentials for media verification");
}

const service = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const alt = `Estate street photographed for private media verification ${Date.now()}`;
let mediaId;
let storagePath;
let browser;

async function hasPublicWebp(url) {
  const response = await fetch(url, { cache: "no-store" });
  const bytes = new Uint8Array(await response.arrayBuffer());
  return response.status === 200
    && response.headers.get("content-type")?.includes("image/webp")
    && Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF"
    && Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP";
}

try {
  const { data: property, error: propertyError } = await service.from("properties")
    .select("id,slug,status").eq("reference", "DMZ-KYC-001").single();
  if (propertyError || !property || property.status !== "published") {
    throw new Error("The approved developer land listing is not available for reversible media verification");
  }

  browser = await chromium.launch({ headless: true });
  const admin = await browser.newPage();
  const reader = await browser.newPage();
  await admin.goto(`${site}/admin/login`);
  await admin.getByLabel("Staff email").fill(email);
  await admin.getByLabel("Password").fill(password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await mobile.goto(`${site}/admin/login`);
  await mobile.getByLabel("Staff email").fill(email);
  await mobile.getByLabel("Password").fill(password);
  await mobile.getByRole("button", { name: "Sign in" }).click();
  await mobile.waitForURL(/\/admin$/, { timeout: 30_000 });
  await mobile.goto(`${site}/admin/properties/${property.id}/edit`);
  await expect(mobile.getByRole("heading", { name: "Property photos" })).toBeVisible();
  await expect(mobile.getByLabel("What does the photo show?").first()).toHaveValue("estate_context");
  await expect(mobile.locator('option[value="property_photo"]')).toHaveCount(0);
  const mobileWidth = await mobile.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  if (mobileWidth.content > mobileWidth.viewport + 1) {
    throw new Error("Property media editor overflows a 375px viewport");
  }
  await mobile.close();

  await admin.goto(`${site}/admin/properties/${property.id}/edit`);
  await expect(admin.getByRole("heading", { name: "Property photos" })).toBeVisible();
  await admin.getByLabel("JPEG, PNG or WebP image (maximum 3 MB)")
    .setInputFiles("public/images/estate/estate-street.webp");
  await admin.getByLabel("Image description (alt text)").first().fill(alt);
  await admin.getByLabel("Caption (optional)").first().fill("Approved estate context, not an individual plot");
  await expect(admin.getByLabel("What does the photo show?").first()).toHaveValue("estate_context");
  await admin.getByRole("button", { name: "Upload for review" }).click();
  await expect(admin.getByText("Image uploaded privately. Review and approve it before public display.")).toBeVisible({ timeout: 30_000 });

  const { data: images, error: imagesError } = await service.from("property_media")
    .select("id,storage_path,verification_status").eq("property_id", property.id).eq("alt_text", alt);
  if (imagesError || images.length !== 1 || images[0].verification_status !== "submitted") {
    throw new Error("Uploaded image did not create one private review record");
  }
  mediaId = images[0].id;
  storagePath = images[0].storage_path;
  const publicImage = `${site}/api/property-media/${mediaId}`;
  if ((await reader.goto(publicImage))?.status() !== 404) {
    throw new Error("Unapproved image could be downloaded anonymously");
  }
  await reader.goto(`${site}/admin/property-media/${mediaId}`);
  await expect(reader).toHaveURL(/\/admin\/login/);
  const staffPreview = await admin.goto(`${site}/admin/property-media/${mediaId}`);
  if (staffPreview?.status() !== 200 || !staffPreview.headers()["content-type"]?.includes("image/webp")) {
    throw new Error("Property staff could not inspect the private image");
  }

  await admin.goto(`${site}/admin/properties/${property.id}/edit`);
  await admin.getByRole("button", { name: "Approve for public view" }).click();
  await expect(admin.getByText("Confirm image rights and classification before approving.")).toBeVisible();
  await admin.getByRole("checkbox", { name: /confirm publication rights/i }).check();
  await admin.getByRole("button", { name: "Approve for public view" }).click();
  await expect(admin.getByText("Image moved to approved and audited.")).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => hasPublicWebp(publicImage), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => {
    const html = await (await fetch(`${site}/properties/${property.slug}`)).text();
    return html.includes(`/api/property-media/${mediaId}`);
  }, { timeout: 30_000 }).toBe(true);

  await admin.getByLabel("Caption (optional)").last().fill("Revised estate context after review");
  await admin.getByRole("button", { name: "Save image details" }).click();
  await expect.poll(async () => (await reader.goto(publicImage))?.status(), {
    timeout: 30_000,
  }).toBe(404);
  await admin.getByRole("checkbox", { name: /confirm publication rights/i }).check();
  await admin.getByRole("button", { name: "Approve for public view" }).click();
  await expect.poll(() => hasPublicWebp(publicImage), { timeout: 30_000 }).toBe(true);
  await admin.getByRole("button", { name: "Withdraw image" }).click();
  await expect.poll(async () => (await reader.goto(publicImage))?.status(), { timeout: 30_000 }).toBe(404);
  await expect.poll(async () => {
    const html = await (await fetch(`${site}/properties/${property.slug}`)).text();
    return html.includes(`/api/property-media/${mediaId}`);
  }, { timeout: 30_000 }).toBe(false);
  console.log("Private upload, classification, review, approval, edit, and withdrawal passed");
} finally {
  await browser?.close();
  if (!mediaId) {
    const { data: remaining } = await service.from("property_media")
      .select("id,storage_path").eq("alt_text", alt);
    mediaId = remaining?.[0]?.id;
    storagePath = remaining?.[0]?.storage_path;
  }
  if (mediaId) {
    const { error: auditError } = await service.from("audit_events").delete()
      .eq("entity_type", "property_media").eq("entity_id", mediaId);
    if (auditError) throw new Error("Temporary image audit events could not be removed");
    const { error: mediaError } = await service.from("property_media").delete().eq("id", mediaId);
    if (mediaError) throw new Error("Temporary image metadata could not be removed");
  }
  if (storagePath) {
    const { error: storageError } = await service.storage.from("property-media").remove([storagePath]);
    if (storageError) throw new Error("Temporary private image file could not be removed");
    const { data: leftover } = await service.storage.from("property-media").download(storagePath);
    if (leftover) throw new Error("Temporary image was still present in private storage");
    console.log("Temporary image, metadata and audit records removed");
  }
}
