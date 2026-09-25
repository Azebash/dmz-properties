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

const service = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: property, error } = await service.from("properties")
  .select("id,slug,status,availability_status,availability_checked_at")
  .eq("reference", "DMZ-KYC-001").single();
if (error || !property || property.status !== "published" ||
  property.availability_status !== "unconfirmed" || property.availability_checked_at !== null) {
  throw new Error("The current developer listing does not have the expected unconfirmed baseline");
}
const { count: before, error: auditError } = await service.from("audit_events")
  .select("id", { count: "exact", head: true }).eq("entity_type", "property")
  .eq("entity_id", property.id).eq("action", "availability_checked");
if (auditError) throw new Error("Availability audit baseline could not be checked");

const browser = await chromium.launch({ headless: true });
try {
  const publicPage = await browser.newPage();
  await publicPage.goto(`${site}/properties/${property.slug}`);
  await expect(publicPage.getByText("Availability to confirm")).toBeVisible();
  await publicPage.goto(`${site}/properties?availability=available`);
  await expect(publicPage.getByRole("heading", { name: "No matching properties" })).toBeVisible();
  await publicPage.getByLabel("Availability check").selectOption("unconfirmed");
  await expect(publicPage.getByRole("link", { name: "600 sqm Virgin Land" })).toBeVisible();

  const admin = await browser.newPage();
  await admin.goto(`${site}/admin/login`);
  await admin.getByLabel("Staff email").fill(email);
  await admin.getByLabel("Password").fill(password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });
  await admin.goto(`${site}/admin/properties/${property.id}/edit`);
  await expect(admin.getByRole("heading", { name: "Inventory availability" })).toBeVisible();
  await expect(admin.getByLabel("Availability after checking with the developer or owner"))
    .toHaveValue("unconfirmed");
  await admin.getByLabel("Availability after checking with the developer or owner").selectOption("available");
  await admin.getByRole("button", { name: "Save availability check" }).click();
  await expect(admin.getByText("Confirm that you checked current inventory with the developer or owner."))
    .toBeVisible();
  const { data: after, error: afterError } = await service.from("properties")
    .select("availability_status,availability_checked_at").eq("id", property.id).single();
  const { count: afterAudits, error: afterAuditError } = await service.from("audit_events")
    .select("id", { count: "exact", head: true }).eq("entity_type", "property")
    .eq("entity_id", property.id).eq("action", "availability_checked");
  if (afterError || afterAuditError || after?.availability_status !== "unconfirmed" ||
    after.availability_checked_at !== null || before !== afterAudits) {
    throw new Error("An unconfirmed stock claim unexpectedly changed the live listing");
  }
  console.log("Availability default, public filters, staff control and no-attestation rejection verified without inventory changes");
} finally {
  await browser.close();
}
