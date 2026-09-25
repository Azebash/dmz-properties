import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

const site = process.argv.includes("--production") ? "https://dmz-properties.vercel.app"
  : process.env.DMZ_VERIFY_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dmz-properties.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;
const governance = process.argv.includes("--staff-governance");
const followUps = process.argv.includes("--follow-ups");

if (!supabaseUrl || !secret || !email || !password ||
  (!site.startsWith("https://") && !/^http:\/\/localhost:\d+$/.test(site))) {
  throw new Error("Workflow verification requires HTTPS (or localhost) and staff/Supabase credentials");
}
if (followUps && site !== "https://dmz-properties.vercel.app" && !/^http:\/\/localhost:\d+$/.test(site)) {
  throw new Error("Follow-up verification requires the canonical site or localhost");
}

const lagosParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
}).formatToParts(new Date());
const lagosPart = (type) => lagosParts.find((part) => part.type === type)?.value;
const todayLagos = `${lagosPart("year")}-${lagosPart("month")}-${lagosPart("day")}`;

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};
const databaseUrl = `${supabaseUrl}/rest/v1`;
const submissionKey = randomUUID();
const preferredDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
const paginationPrefix = `Reminder Page Fixture ${randomUUID().slice(0, 8)}`;
let enquiryId;
let inspectionId;
let paginationIds = [];
let browser;

async function databaseRequest(path, options = {}) {
  const response = await fetch(`${databaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok) throw new Error(`Database ${options.method || "GET"} failed: ${response.status}`);
  if (response.status === 204) return null;
  if (options.method === "HEAD") {
    const total = response.headers.get("content-range")?.split("/")[1];
    return Number(total || 0);
  }
  return response.json();
}

async function dueListText(page, expectedTotal) {
  const allRows = [];
  const pageCount = Math.max(1, Math.ceil(expectedTotal / 50));
  for (let current = 1; current <= pageCount; current += 1) {
    const region = page.getByRole("region", { name: "Follow-ups due" });
    const first = (current - 1) * 50 + 1;
    const last = Math.min(current * 50, expectedTotal);
    await expect(region.getByText(`Showing ${first}–${last} of ${expectedTotal} due follow-ups`, { exact: true }))
      .toBeVisible();
    allRows.push(...await region.locator("li").allTextContents());
    if (current < pageCount) {
      await region.getByRole("link", { name: "Next" }).click();
      await page.waitForURL(new RegExp(`followUpPage=${current + 1}#due-follow-ups$`));
    }
  }
  return allRows;
}

async function enquiryListText(page, expectedTotal) {
  const allRows = [];
  const pageCount = Math.max(1, Math.ceil(expectedTotal / 50));
  for (let current = 1; current <= pageCount; current += 1) {
    const region = page.getByRole("region", { name: "All enquiries" });
    const first = (current - 1) * 50 + 1;
    const last = Math.min(current * 50, expectedTotal);
    await expect(region.getByText(`Showing ${first}–${last} of ${expectedTotal} enquiries`, { exact: true }))
      .toBeVisible();
    allRows.push(...await region.locator("tbody tr").allTextContents());
    if (current < pageCount) {
      await region.getByRole("link", { name: "Next" }).click();
      await page.waitForURL(new RegExp(`inboxPage=${current + 1}#latest-enquiries$`));
    }
  }
  return allRows;
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

  let dueBefore = 0;
  let enquiriesBefore = 0;
  if (followUps) {
    dueBefore = await databaseRequest(
      `/enquiries?select=id&status=in.(new,qualified,inspection,offer)&follow_up_on=lte.${todayLagos}`,
      { method: "HEAD", headers: { Prefer: "count=exact", Range: "0-0" } },
    );
    enquiriesBefore = await databaseRequest("/enquiries?select=id", {
      method: "HEAD", headers: { Prefer: "count=exact", Range: "0-0" },
    });
    const fixtures = Array.from({ length: 50 }, (_, index) => ({
      submission_key: randomUUID(),
      enquiry_type: "Buying a plot",
      name: `${paginationPrefix} ${String(index + 1).padStart(2, "0")}`,
      email: "reminder-pagination@example.com",
      phone: "+2348000000000",
      message: "Synthetic fixture for due follow-up pagination verification.",
      privacy_consent_at: new Date().toISOString(),
      status: "qualified",
      follow_up_on: todayLagos,
    }));
    const inserted = await databaseRequest("/enquiries", {
      method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(fixtures),
    });
    paginationIds = inserted.map((row) => row.id);
    if (paginationIds.length !== 50) throw new Error("Could not create follow-up pagination fixtures");
  }

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
  if (followUps) {
    await page.getByLabel("Follow up by (Abuja date)").fill(todayLagos);
    await page.getByRole("button", { name: "Save follow-up date" }).click();
    await expect(page.getByText("Follow-up scheduled and audited. Check the staff inbox for due reminders."))
      .toBeVisible();
    await page.goto(`${site}/admin/enquiries`, { waitUntil: "networkidle" });
    const expectedDue = dueBefore + 51;
    const pagedRows = await dueListText(page, expectedDue);
    const visibleFixtures = pagedRows.filter((row) => row.includes(paginationPrefix));
    if (visibleFixtures.length !== 50 || !pagedRows.some((row) => row.includes("Workflow Verification"))) {
      throw new Error("Due follow-up pages did not include each synthetic record exactly once");
    }
    const due = page.getByRole("region", { name: "Follow-ups due" });
    await expect(due.getByRole("link", { name: "Next" })).toHaveCount(0);
    await page.setViewportSize({ width: 375, height: 812 });
    const mobile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    if (mobile.content > mobile.viewport + 1) throw new Error("Due inbox overflows a 375px viewport");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${site}/admin/enquiries?inboxPage=2`, { waitUntil: "networkidle" });
    await expect(page.getByRole("region", { name: "All enquiries" })
      .getByText(`Showing 51–${Math.min(100, enquiriesBefore + 50)} of ${enquiriesBefore + 50} enquiries`, { exact: true }))
      .toBeVisible();
    if (followUps) {
      await expect(page.getByRole("region", { name: "Follow-ups due" })
        .getByRole("link", { name: "Next" })).toHaveAttribute("href", /inboxPage=2/);
    }
    await page.goto(`${site}/admin/enquiries`, { waitUntil: "networkidle" });
    const inboxRows = await enquiryListText(page, enquiriesBefore + 50);
    const inboxFixtures = inboxRows.filter((row) => row.includes(paginationPrefix));
    if (inboxFixtures.length !== 50 || !inboxRows.some((row) => row.includes("Workflow Verification"))) {
      throw new Error("Enquiry inbox pages did not include each synthetic record exactly once");
    }
    await page.goto(`${site}/admin/enquiries/${enquiryId}`, { waitUntil: "networkidle" });
    const pending = await databaseRequest(`/enquiries?id=eq.${enquiryId}&select=follow_up_on`);
    if (pending[0]?.follow_up_on !== todayLagos) throw new Error("Due reminder was not stored");
    await page.getByLabel("Lead stage").selectOption("lost");
    await page.getByRole("button", { name: "Save follow-up", exact: true }).click();
    await expect(page.locator(".admin-edit-header .admin-status")).toHaveText("lost", { timeout: 30_000 });
    const closed = await databaseRequest(`/enquiries?id=eq.${enquiryId}&select=follow_up_on`);
    if (closed[0]?.follow_up_on !== null) throw new Error("Terminal lead retained an active reminder");
    await page.goto(`${site}/admin/enquiries`, { waitUntil: "networkidle" });
    const rowsAfterClose = await dueListText(page, expectedDue - 1);
    if (rowsAfterClose.some((row) => row.includes("Workflow Verification"))) {
      throw new Error("Closed lead remained in paginated due reminders");
    }
    const events = await databaseRequest(`/audit_events?entity_id=eq.${enquiryId}&action=in.(follow_up_changed,workflow_updated)&select=id`);
    if (events.length !== 2) throw new Error("Scheduling and closing the reminder were not audited");
    console.log("Due and enquiry pagination, scheduling, terminal cleanup and audit events verified");
  } else {
    await page.getByLabel("Lead stage").selectOption("qualified");
    await page.getByLabel("Private follow-up notes").fill("Confirmed remote buyer interest.");
    await page.getByRole("button", { name: "Save follow-up", exact: true }).click();
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
    await expect(page.getByText("Time zone updated and audited.")).toBeVisible({ timeout: 30_000 });
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
  }
} finally {
  await browser?.close();
  if (enquiryId) {
    if (followUps) {
      const fixtures = await databaseRequest(
        `/enquiries?name=like.${encodeURIComponent(`${paginationPrefix}*`)}&select=id`,
      );
      paginationIds = [...new Set([...paginationIds, ...fixtures.map((row) => row.id)])];
    }
    const allIds = [enquiryId, inspectionId, ...paginationIds].filter(Boolean).join(",");
    await databaseRequest(`/audit_events?entity_id=in.(${allIds})`, {
      method: "DELETE",
    });
    await databaseRequest(`/enquiries?id=in.(${[enquiryId, ...paginationIds].join(",")})`, { method: "DELETE" });
    const leftovers = await databaseRequest(`/enquiries?id=in.(${[enquiryId, ...paginationIds].join(",")})&select=id`);
    if (leftovers.length) throw new Error("Temporary verification enquiry was not removed");
    console.log("Temporary workflow records removed");
  }
}
