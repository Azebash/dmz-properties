import { chromium, expect } from "@playwright/test";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dmz-properties.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!site.startsWith("https://") || !supabaseUrl || !secret) {
  throw new Error("Production form verification needs HTTPS and local Supabase credentials");
}

const databaseUrl = `${supabaseUrl}/rest/v1`;
const suffix = Date.now();
const cases = [
  { kind: "buyer", email: `p0-form-buyer-${suffix}@example.com` },
  { kind: "seller", email: `p0-form-seller-${suffix}@example.com` },
  { kind: "inspection", email: `p0-form-inspection-${suffix}@example.com` },
  { kind: "honeypot", email: `p0-form-honeypot-${suffix}@example.com` },
];
const preferredDate = new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10);
const alternateDate = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
let browser;

async function databaseRequest(path, options = {}) {
  const response = await fetch(`${databaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Fixture database request failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

try {
  browser = await chromium.launch({ headless: true });
  for (const fixture of cases) {
    const page = await browser.newPage();
    const path = fixture.kind === "buyer" || fixture.kind === "honeypot"
      ? "/contact?utm_source=p0-form-check"
      : fixture.kind === "seller" ? "/sell" : "/book-inspection?property=DMZ-KYC-001";
    await page.goto(`${site}${path}`);
    await page.getByLabel("Full name").fill(`P0 Form Check ${fixture.kind}`);
    await page.getByLabel("Email address").fill(fixture.email);
    await page.getByLabel("Phone or WhatsApp").fill("+2348000000000");
    if (fixture.kind === "buyer" || fixture.kind === "honeypot") {
      await page.getByLabel("I am interested in").selectOption("Buying a plot");
      await page.getByLabel("Expected timeline").selectOption("Within 3 months");
    }
    if (fixture.kind === "seller") {
      await expect(page.getByLabel("I am interested in")).toHaveValue(
        "Selling my KYC Homes Phase II property",
      );
    }
    if (fixture.kind === "inspection") {
      await page.getByLabel("Inspection preference").selectOption("Live video inspection");
      await page.getByLabel("Preferred date").fill(preferredDate);
      await page.getByLabel("Alternate date").fill(alternateDate);
      await page.getByLabel("Your time zone").fill("Africa/Lagos");
    }
    await page.getByLabel("Property requirements or details").fill(
      `Synthetic ${fixture.kind} form verification; remove after the production check.`,
    );
    await page.getByRole("checkbox").check();
    if (fixture.kind === "honeypot") {
      await page.locator('input[name="website"]').fill("synthetic-bot-check");
    }
    await page.getByRole("button", {
      name: fixture.kind === "buyer" || fixture.kind === "honeypot" ? "Send enquiry" : fixture.kind === "seller"
        ? "Request a resale review" : "Request inspection",
    }).click();
    await expect(page.getByRole("status")).toContainText("has been received", {
      timeout: 30_000,
    });

    const enquiries = await databaseRequest(
      `/enquiries?email=eq.${fixture.email}&select=id,enquiry_type,property_reference,privacy_consent_at,attribution`,
    );
    if (fixture.kind === "honeypot") {
      if (enquiries.length) throw new Error("Honeypot submission was persisted");
      console.log("honeypot form: accepted without persistence");
      await page.close();
      continue;
    }
    if (enquiries.length !== 1 || !enquiries[0].privacy_consent_at) {
      throw new Error(`${fixture.kind} form did not persist one consented enquiry`);
    }
    const expectedInterest = fixture.kind === "buyer" ? "Buying a plot"
      : fixture.kind === "seller" ? "Selling my KYC Homes Phase II property"
        : "Booking an inspection";
    if (enquiries[0].enquiry_type !== expectedInterest ||
      (fixture.kind === "buyer" && enquiries[0].attribution?.utmSource !== "p0-form-check")) {
      throw new Error(`${fixture.kind} form lost its enquiry type or campaign attribution`);
    }
    if (fixture.kind === "inspection") {
      const inspections = await databaseRequest(
        `/inspections?enquiry_id=eq.${enquiries[0].id}&select=inspection_type,preferred_date,time_zone`,
      );
      if (inspections.length !== 1 || inspections[0].preferred_date !== preferredDate ||
        inspections[0].time_zone !== "Africa/Lagos" ||
        enquiries[0].property_reference !== "DMZ-KYC-001") {
        throw new Error("Inspection form lost its booking or property context");
      }
    }
    if (fixture.kind === "seller") {
      const sellers = await databaseRequest(
        `/seller_submissions?enquiry_id=eq.${enquiries[0].id}&select=id,owner_email`,
      );
      if (sellers.length !== 1 || sellers[0].owner_email !== fixture.email) {
        throw new Error("Seller form did not create a private review record");
      }
    }
    console.log(`${fixture.kind} form: received and persisted`);
    await page.close();
  }
} finally {
  await browser?.close();
  for (const fixture of cases) {
    const enquiries = await databaseRequest(`/enquiries?email=eq.${fixture.email}&select=id`);
    for (const enquiry of enquiries) {
      await databaseRequest(`/audit_events?entity_type=eq.enquiry&entity_id=eq.${enquiry.id}`, {
        method: "DELETE",
      });
      await databaseRequest(`/enquiries?id=eq.${enquiry.id}`, { method: "DELETE" });
    }
    if ((await databaseRequest(`/enquiries?email=eq.${fixture.email}&select=id`)).length) {
      throw new Error(`${fixture.kind} test enquiry was not removed`);
    }
    for (const enquiry of enquiries) {
      const [inspections, sellers, audits] = await Promise.all([
        databaseRequest(`/inspections?enquiry_id=eq.${enquiry.id}&select=id`),
        databaseRequest(`/seller_submissions?enquiry_id=eq.${enquiry.id}&select=id`),
        databaseRequest(`/audit_events?entity_type=eq.enquiry&entity_id=eq.${enquiry.id}&select=id`),
      ]);
      if (inspections.length || sellers.length || audits.length) {
        throw new Error(`${fixture.kind} test child or audit records were not removed`);
      }
    }
  }
  console.log("All synthetic form, child workflow, and audit records removed");
}
