import { chromium, expect } from "@playwright/test";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dmz-properties.vercel.app";
const database = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
const slug = "kyc-homes-phase-ii";
const editorUrl = `${site}/admin/areas/${slug}`;
const publicUrl = `${site}/areas/${slug}`;
const headline = `Temporary area guide review ${Date.now()}`;
const searchTitle = `Temporary KYC area guide review ${Date.now()}`;

if (!site.startsWith("https://") || !secret || !email || !password || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Live area guide verification requires HTTPS and local staff/Supabase credentials");
}

async function request(path, options = {}) {
  const response = await fetch(`${database}${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Area guide database request failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const guidePath = `/area_guides?slug=eq.${slug}`;
const auditPath = `/audit_events?entity_type=eq.area_guide&entity_id=eq.${slug}`;
const [original] = await request(`${guidePath}&select=*`);
if (!original || original.status !== "published" ||
  JSON.stringify(original.draft_copy) !== JSON.stringify(original.published_copy)) {
  throw new Error("Area guide has pending editorial work; verification will not overwrite it");
}
const originalAuditIds = new Set((await request(`${auditPath}&select=id`)).map((event) => event.id));
let browser;
let admin;
let reader;
let temporaryPublished = false;

try {
  browser = await chromium.launch({ headless: true });
  reader = await browser.newPage();
  admin = await browser.newPage();
  await reader.goto(editorUrl);
  await expect(reader).toHaveURL(/\/admin\/login/);
  await reader.goto(publicUrl);
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(original.published_copy.heroTitle);
  await admin.goto(`${site}/admin/login`, { waitUntil: "networkidle" });
  await admin.getByLabel("Staff email").fill(email);
  await admin.getByLabel("Password").fill(password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });

  await admin.goto(editorUrl);
  await expect(admin.getByLabel("Opening headline")).toHaveValue(original.draft_copy.heroTitle);
  await admin.getByLabel("Opening headline").fill(headline);
  await admin.getByLabel("Search title", { exact: true }).fill(searchTitle);
  await admin.getByRole("button", { name: "Save as draft" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("draft", { timeout: 30_000 });
  await reader.reload();
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(original.published_copy.heroTitle);

  await admin.getByRole("button", { name: "Move to under review" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("under review", { timeout: 30_000 });
  await admin.getByRole("button", { name: "Move to published" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("published", { timeout: 30_000 });
  temporaryPublished = true;
  await expect.poll(async () => {
    await reader.goto(publicUrl);
    return reader.getByRole("heading", { level: 1 }).textContent();
  }, { timeout: 90_000 }).toBe(headline);
  await expect(reader).toHaveTitle(new RegExp(searchTitle));
  await expect(reader.locator('link[rel="canonical"]')).toHaveAttribute("href", publicUrl);
  const events = await request(`${auditPath}&select=id,action`);
  if (events.filter((event) => !originalAuditIds.has(event.id)).length !== 3) {
    throw new Error("Expected an audited draft, review, and publication");
  }
  console.log("Area guide draft, review, publication, SEO, and audit checks passed");
} finally {
  try {
    if (temporaryPublished && admin) {
      await admin.goto(editorUrl);
      await admin.getByLabel("Opening headline").fill(original.draft_copy.heroTitle);
      await admin.getByLabel("Search title", { exact: true }).fill(original.draft_copy.seoTitle);
      await admin.getByRole("button", { name: "Save as draft" }).click();
      await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("draft", { timeout: 30_000 });
      await admin.getByRole("button", { name: "Move to under review" }).click();
      await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("under review", { timeout: 30_000 });
      await admin.getByRole("button", { name: "Move to published" }).click();
      await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("published", { timeout: 30_000 });
      await expect.poll(async () => {
        await reader.goto(publicUrl);
        return reader.getByRole("heading", { level: 1 }).textContent();
      }, { timeout: 90_000 }).toBe(original.published_copy.heroTitle);
    }
  } finally {
    await request(guidePath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: original.status,
        draft_copy: original.draft_copy,
        published_copy: original.published_copy,
        published_at: original.published_at,
        updated_at: original.updated_at,
        updated_by: original.updated_by,
      }),
    });
    const createdEvents = (await request(`${auditPath}&select=id`))
      .filter((event) => !originalAuditIds.has(event.id)).map((event) => event.id);
    if (createdEvents.length) {
      await request(`/audit_events?id=in.(${createdEvents.join(",")})`, { method: "DELETE" });
    }
    await browser?.close();
    const [restored] = await request(`${guidePath}&select=*`);
    if (JSON.stringify(restored) !== JSON.stringify(original)) {
      throw new Error("Area guide verification did not restore the original record");
    }
    console.log("Original area guide and audit history restored");
  }
}
