import { chromium, expect } from "@playwright/test";

const site = process.env.DMZ_VERIFY_SITE_URL || "http://localhost:3100";
const database = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
if (!site.startsWith("http://localhost:") || !secret || !email || !password) {
  throw new Error("Use a local build and linked Supabase credentials for this reversible property check");
}

const stamp = Date.now();
const slug = `temporary-property-check-${stamp}`;
const reference = `DMZ-TEST-${stamp}`;
const verifiedDate = new Date().toISOString().slice(0, 10);
let browser;
let propertyId;

async function databaseRequest(path, options = {}) {
  const response = await fetch(`${database}${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Property fixture cleanup failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

try {
  browser = await chromium.launch({ headless: true });
  const admin = await browser.newPage();
  const reader = await browser.newPage();
  await admin.goto(`${site}/admin/login`);
  await admin.getByLabel("Staff email").fill(email);
  await admin.getByLabel("Password").fill(password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });

  await admin.goto(`${site}/admin/properties/new`);
  await admin.getByLabel("Reference").fill(reference);
  await admin.getByLabel("Source").selectOption("owner_resale");
  await admin.getByLabel("Title", { exact: true }).fill("Synthetic owner-resale verification");
  await admin.getByLabel("URL slug").fill(slug);
  await admin.getByLabel("Property type").fill("House");
  await admin.getByLabel("Location name").fill("KYC Homes Phase II");
  await admin.getByLabel("Price amount").fill("10000000");
  await admin.getByLabel("Plot size (sqm)").fill("600");
  await admin.getByLabel("Description", { exact: true }).fill("Synthetic property workflow verification; remove this fixture after testing.");
  await admin.getByLabel("Features, one per line").fill("Temporary test record");
  await admin.getByLabel("Last verified").fill(verifiedDate);
  await admin.getByRole("button", { name: "Create draft" }).click();
  await admin.waitForURL(/\/admin\/properties\/[^/]+\/edit\?saved=1/, { timeout: 30_000 });
  propertyId = admin.url().match(/properties\/([^/]+)\/edit/)?.[1];
  if (!propertyId) throw new Error("Synthetic property ID was not returned");
  const publicPath = `/properties/${slug}`;
  const publicUrl = `${site}${publicPath}`;
  if ((await reader.goto(publicUrl))?.status() !== 404) throw new Error("Draft property was public");

  await admin.getByRole("button", { name: "Move to under review" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("under review", { timeout: 30_000 });
  await admin.getByRole("button", { name: "Move to published" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("published", { timeout: 30_000 });
  await expect.poll(async () => (await reader.goto(publicUrl))?.status(), { timeout: 30_000 }).toBe(200);
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText("Synthetic owner-resale verification");
  await expect(reader.getByText(/listing-specific photography has not been approved/i)).toBeVisible();
  await expect(reader.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${publicPath}$`));
  await expect.poll(async () => (await (await fetch(`${site}/sitemap.xml`)).text()).includes(publicPath), {
    timeout: 30_000,
  }).toBe(true);
  await expect.poll(async () => (await (await fetch(`${site}/properties`)).text()).includes(`/properties/${slug}`), {
    timeout: 30_000,
  }).toBe(true);

  const hostileTitle = 'Synthetic </script><script>window.__dmzInjected=1</script>';
  await admin.getByLabel("Title", { exact: true }).fill(hostileTitle);
  await admin.getByRole("button", { name: "Save property" }).click();
  await admin.waitForURL(/\/edit\?saved=1$/, { timeout: 30_000 });
  await expect(admin.getByLabel("Title", { exact: true })).toHaveValue(hostileTitle);
  await expect.poll(async () => {
    await reader.goto(publicUrl);
    return reader.getByRole("heading", { level: 1 }).textContent();
  }, { timeout: 30_000 }).toBe(hostileTitle);
  expect(await reader.evaluate(() => typeof (window).__dmzInjected)).toBe("undefined");

  await admin.getByLabel("Title", { exact: true }).fill("Updated synthetic resale verification");
  await admin.getByLabel("Price amount").fill("11000000");
  await Promise.all([
    admin.waitForResponse((response) => response.request().method() === "POST" &&
      response.url().includes(`/admin/properties/${propertyId}/edit`), { timeout: 30_000 }),
    admin.getByRole("button", { name: "Save property" }).click(),
  ]);
  await expect.poll(async () => {
    await reader.goto(publicUrl);
    return reader.getByRole("heading", { level: 1 }).textContent();
  }, { timeout: 30_000 }).toBe("Updated synthetic resale verification");
  await expect(reader.getByText("NGN 11,000,000", { exact: true })).toBeVisible();

  await admin.getByRole("button", { name: "Move to reserved" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("reserved", { timeout: 30_000 });
  await expect.poll(async () => (await reader.goto(publicUrl))?.status(), { timeout: 30_000 }).toBe(404);
  await expect.poll(async () => (await (await fetch(`${site}/sitemap.xml`)).text()).includes(publicPath), {
    timeout: 30_000,
  }).toBe(false);
  console.log("Draft privacy, review, publication, placeholder, live edit, and reservation passed");
} finally {
  await browser?.close();
  const found = await databaseRequest(`/properties?reference=eq.${reference}&select=id`);
  propertyId ||= found[0]?.id;
  if (propertyId) {
    await databaseRequest(`/audit_events?entity_type=eq.property&entity_id=eq.${propertyId}`, { method: "DELETE" });
    await databaseRequest(`/properties?id=eq.${propertyId}`, { method: "DELETE" });
    if ((await databaseRequest(`/properties?id=eq.${propertyId}&select=id`)).length) {
      throw new Error("Synthetic property was not removed");
    }
    console.log("Synthetic property and audit records removed");
  }
}
