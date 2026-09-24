import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

const site = process.env.DMZ_VERIFY_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dmz-properties.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
const governance = process.argv.includes("--staff-governance");

if (!supabaseUrl || !secret || !email || !password ||
  (!site.startsWith("https://") && !/^http:\/\/localhost:\d+$/.test(site))) {
  throw new Error("Workflow verification requires HTTPS (or localhost) and staff/Supabase credentials");
}

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};
const databaseUrl = `${supabaseUrl}/rest/v1`;
const submissionKey = randomUUID();
const preferredDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
let enquiryId;
let inspectionId;
let browser;

async function databaseRequest(path, options = {}) {
  const response = await fetch(`${databaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok) throw new Error(`Database ${options.method || "GET"} failed: ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

try {
  const payload = {
    submissionKey,
    interest: "Booking an inspection",
    name: "Workflow Verification",
    email: "workflow-verification@example.com",
    phone: "+2348000000000",
    location: "London",
    propertyReference: "DMZ-KYC-001",
    inspectionPreference: "Live video inspection",
    inspectionDate: preferredDate,
    timeZone: "West Africa Time",
    contactMethod: "Email",
    message: "Temporary verification of enquiry and inspection staff workflows.",
  };
  enquiryId = await databaseRequest("/rpc/ingest_enquiry", {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
  const inspections = await databaseRequest(
    `/inspections?enquiry_id=eq.${enquiryId}&select=id`,
  );
  inspectionId = inspections[0]?.id;
  if (!inspectionId) throw new Error("Test inspection was not created");

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${site}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Staff email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/, { timeout: 30_000 });

  if (governance) {
    await page.goto(`${site}/admin/staff`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Staff", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hafiz Bashir" })).toBeVisible();
  }

  await page.goto(`${site}/admin/enquiries/${enquiryId}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Workflow Verification" })).toBeVisible();
  if (governance) {
    await page.getByLabel("Assigned to").selectOption({ label: "Hafiz Bashir" });
    await page.getByRole("button", { name: "Save assignment" }).click();
    await expect(page.getByText("Lead and linked inspection ownership updated.")).toBeVisible();
  }
  await page.getByLabel("Lead stage").selectOption("qualified");
  await page.getByLabel("Private follow-up notes").fill("Confirmed remote buyer interest.");
  await page.getByRole("button", { name: "Save follow-up" }).click();
  await expect(page.locator(".admin-edit-header .admin-status")).toHaveText("qualified", {
    timeout: 30_000,
  });

  await page.goto(`${site}/admin/inspections/${inspectionId}`, { waitUntil: "networkidle" });
  if (governance) {
    await expect(page.getByLabel("Assigned to")).toHaveValue(
      (await databaseRequest(`/enquiries?id=eq.${enquiryId}&select=assigned_to`))[0].assigned_to,
    );
  }
  await page.getByLabel("Time zone", { exact: true }).fill("Africa/Lagos");
  await page.getByRole("button", { name: "Update time zone" }).click();
  await expect(page.getByText("Time zone updated and audited.")).toBeVisible();
  await page.getByLabel("Next step").selectOption("confirmed");
  await page.getByLabel("Appointment in Africa/Lagos").fill(`${preferredDate}T12:00`);
  await page.getByRole("button", { name: "Save inspection" }).click();
  await expect(page.locator(".admin-edit-header .admin-status")).toHaveText("confirmed", {
    timeout: 30_000,
  });
  await page.getByLabel("Next step").selectOption("completed");
  await page.getByLabel("Private outcome notes").fill("Buyer attended the remote inspection and requested documents.");
  await page.getByRole("button", { name: "Save inspection" }).click();
  await expect(page.locator(".admin-edit-header .admin-status")).toHaveText("completed", {
    timeout: 30_000,
  });

  const enquiry = await databaseRequest(`/enquiries?id=eq.${enquiryId}&select=status,internal_notes`);
  const inspection = await databaseRequest(
    `/inspections?id=eq.${inspectionId}&select=status,time_zone,scheduled_at,outcome_notes`,
  );
  const activity = await databaseRequest(
    `/audit_events?entity_id=in.(${enquiryId},${inspectionId})&action=in.(workflow_updated,time_zone_corrected)&select=id`,
  );
  const assignments = governance ? await databaseRequest(
    `/audit_events?entity_id=in.(${enquiryId},${inspectionId})&action=eq.assigned&select=id`,
  ) : [];
  if (enquiry[0]?.status !== "qualified" ||
      inspection[0]?.status !== "completed" ||
      inspection[0]?.time_zone !== "Africa/Lagos" ||
      !inspection[0]?.scheduled_at ||
      activity.length !== 4 || assignments.length !== (governance ? 2 : 0)) {
    throw new Error("Workflow state or audit records do not match the browser actions");
  }
  console.log(JSON.stringify({ enquiry: "qualified", inspection: "completed", audits: activity.length + assignments.length }));
} finally {
  await browser?.close();
  if (enquiryId) {
    await databaseRequest(`/audit_events?entity_id=in.(${enquiryId},${inspectionId || enquiryId})`, {
      method: "DELETE",
    });
    await databaseRequest(`/enquiries?id=eq.${enquiryId}`, { method: "DELETE" });
    const leftovers = await databaseRequest(`/enquiries?id=eq.${enquiryId}&select=id`);
    if (leftovers.length) throw new Error("Temporary verification enquiry was not removed");
    console.log("Temporary workflow records removed");
  }
}
