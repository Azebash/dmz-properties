import { randomBytes } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const site = process.env.DMZ_VERIFY_SITE_URL || "http://localhost:3100";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const adminEmail = process.env.DMZ_ADMIN_EMAIL;
const adminPassword = process.env.DMZ_ADMIN_TEMP_PASSWORD;
if (!site.startsWith("http://localhost:") || !url || !secret || !adminEmail || !adminPassword) {
  throw new Error("Use a local build and linked Supabase credentials for this reversible governance check");
}

const service = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const email = `temporary-staff-${Date.now()}@example.com`;
const password = `${randomBytes(24).toString("base64url")}Aa1!`;
let userId;
let browser;

try {
  const { data, error } = await service.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error || !data.user?.id) throw new Error("Synthetic Auth account could not be created");
  userId = data.user.id;

  browser = await chromium.launch({ headless: true });
  const admin = await browser.newPage();
  await admin.goto(`${site}/admin/login`);
  await admin.getByLabel("Staff email").fill(adminEmail);
  await admin.getByLabel("Password").fill(adminPassword);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });
  await admin.goto(`${site}/admin/staff`);
  await admin.getByLabel("Auth user ID").fill(userId);
  await admin.getByLabel("Display name").fill("Temporary Staff Verification");
  await admin.getByRole("button", { name: "Grant staff access" }).click();
  await expect(admin.getByText("Existing Auth user granted audited staff access.")).toBeVisible();

  const viewer = await browser.newPage();
  await viewer.goto(`${site}/admin/login`);
  await viewer.getByLabel("Staff email").fill(email);
  await viewer.getByLabel("Password").fill(password);
  await viewer.getByRole("button", { name: "Sign in" }).click();
  await viewer.waitForURL(/\/admin$/, { timeout: 30_000 });
  await expect(viewer.getByRole("heading", { name: "Welcome, Temporary Staff Verification." })).toBeVisible({ timeout: 30_000 });
  await viewer.goto(`${site}/admin/staff`);
  await expect(viewer).toHaveURL(/\/admin\/access-denied$/);
  await viewer.goto(`${site}/admin/enquiries`);
  await expect(viewer).toHaveURL(/\/admin\/access-denied$/);

  await admin.goto(`${site}/admin/staff/${userId}`);
  await admin.getByLabel("Role", { exact: true }).selectOption("content_editor");
  await admin.getByRole("button", { name: "Save access" }).click();
  await expect(admin.getByText("Staff access updated and audited.")).toBeVisible();
  await viewer.goto(`${site}/admin/content`);
  await expect(viewer.getByRole("heading", { name: "Content" })).toBeVisible();
  await viewer.goto(`${site}/admin/enquiries`);
  await expect(viewer).toHaveURL(/\/admin\/access-denied$/);

  await admin.getByLabel("Access").selectOption("false");
  await admin.getByRole("button", { name: "Save access" }).click();
  await expect.poll(async () => {
    const { data: profile } = await service.from("staff_profiles")
      .select("active").eq("user_id", userId).single();
    return profile?.active;
  }, { timeout: 30_000 }).toBe(false);
  await viewer.goto(`${site}/admin`);
  await expect(viewer).toHaveURL(/\/admin\/access-denied$/);
  console.log("Synthetic existing-user onboarding, role changes, and private-record denials passed");
} finally {
  await browser?.close();
  if (userId) {
    await service.from("audit_events").delete().eq("entity_type", "staff_profile").eq("entity_id", userId);
    const { error: profileError } = await service.from("staff_profiles")
      .delete().eq("user_id", userId);
    if (profileError) throw new Error("Synthetic staff profile could not be removed");
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) throw new Error("Synthetic Auth user could not be removed");
    console.log("Synthetic staff account removed");
  }
}
