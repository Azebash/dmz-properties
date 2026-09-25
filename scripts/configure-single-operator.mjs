import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const site = "https://dmz-properties.vercel.app";
if (!process.argv.includes("--production") || !process.argv.includes("--apply")) {
  throw new Error("This changes live lead ownership. Re-run with both --production and --apply to confirm the one-operator setup.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
if (!url || !secret || !email || !password) throw new Error("Administrator and server-only Supabase credentials are required");

const service = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const { count: openUnassignedBefore, error: beforeError } = await service.from("enquiries")
  .select("id", { count: "exact", head: true })
  .is("assigned_to", null).in("status", ["new", "qualified", "inspection", "offer"]);
if (beforeError) throw new Error("Could not count open unassigned enquiries before setup");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${site}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Staff email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/, { timeout: 30_000 });
  await page.goto(`${site}/admin/staff`, { waitUntil: "networkidle" });

  const owner = page.getByLabel("Default lead owner");
  const eligibleOwners = await owner.locator("option").evaluateAll((options) =>
    options.map((option) => (option instanceof HTMLOptionElement ? option.value : "")).filter(Boolean));
  if (eligibleOwners.length !== 1) {
    throw new Error(`Expected exactly one eligible property operator; found ${eligibleOwners.length}. No routing changes were made.`);
  }
  await owner.selectOption(eligibleOwners[0]);
  await page.locator('input[name="assignExisting"]').check();
  await page.getByRole("button", { name: "Save lead routing" }).click();
  await expect(page.getByText("Default owner saved; existing unassigned open leads and their inspections were assigned."))
    .toBeVisible({ timeout: 30_000 });

  const { data: setting, error: settingError } = await service.from("lead_routing_settings")
    .select("default_assignee").eq("singleton", true).single();
  const { count: openUnassignedAfter, error: afterError } = await service.from("enquiries")
    .select("id", { count: "exact", head: true })
    .is("assigned_to", null).in("status", ["new", "qualified", "inspection", "offer"]);
  if (settingError || afterError || setting.default_assignee !== eligibleOwners[0] || openUnassignedAfter !== 0) {
    throw new Error("Single-operator routing was saved but verification did not match the expected setup");
  }
  console.log(JSON.stringify({ eligibleOperators: 1, defaultRouting: "enabled",
    existingOpenLeadsAssigned: openUnassignedBefore || 0, unassignedOpenLeadsRemaining: openUnassignedAfter }));
} finally {
  await browser.close();
}
