import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("homepage presents the brand, estate photography, and responsive layout", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Know what you are buying." }),
  ).toBeVisible();
  await expect(page.getByText("KYC Homes Phase II", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".hero-media img")).toHaveJSProperty("complete", true);
  await expectNoHorizontalOverflow(page);
});

test("primary navigation reaches the KYC Homes Phase II area guide", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");

  if (isMobile) await page.getByText("Menu", { exact: true }).click();
  await page.getByRole("link", { name: /KYC Homes/ }).first().click();

  await expect(page).toHaveURL(/\/areas\/kyc-homes-phase-ii$/, {
    timeout: 20_000,
  });
  await expect(
    page.getByRole("heading", { name: "KYC Homes Phase II, understood from within." }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("property discovery filters and carries listing context into an enquiry", async ({
  page,
}) => {
  await page.goto("/properties");

  await page.getByLabel("Search properties").fill("DMZ-KYC-001");
  await expect(page.getByText("1 property", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "600 sqm Virgin Land" }).click();

  await expect(page).toHaveURL(/\/properties\/600sqm-virgin-land-kyc-homes-phase-ii$/, {
    timeout: 20_000,
  });
  await expect(page.getByText("DMZ-KYC-001", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Request an inspection" }).click();
  await expect(page).toHaveURL(/property=DMZ-KYC-001/, { timeout: 20_000 });
  await expect(page.locator(".form-property")).toContainText("DMZ-KYC-001");
});

test("enquiry form submits a qualified buyer request", async ({ page }) => {
  let submitted: Record<string, string> | undefined;
  await page.route("**/api/enquiries", async (route) => {
    submitted = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Enquiry received." }),
    });
  });
  await page.goto(
    "/contact?utm_source=facebook&utm_medium=paid-social&utm_campaign=diaspora&ref=ABUJA01",
  );

  await page.getByLabel("Full name").fill("Ada Buyer");
  await page.getByLabel("Email address").fill("ada@example.com");
  await page.getByLabel("Phone or WhatsApp").fill("+2348000000000");
  await page.getByLabel("I am interested in").selectOption("Buying a plot");
  await page.getByLabel("Expected timeline").selectOption("Within 3 months");
  await page.getByLabel("Inspection preference").selectOption("Live video inspection");
  await page.getByLabel("Property requirements or details").fill(
    "I would like a current plot option and a live inspection.",
  );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send enquiry" }).click();

  await expect(page.getByRole("status")).toContainText("has been received");
  expect(submitted).toMatchObject({
    utmSource: "facebook",
    utmMedium: "paid-social",
    utmCampaign: "diaspora",
    referralCode: "ABUJA01",
  });
});

test("contact details expose callable and WhatsApp channels", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("link", { name: "+234 810 370 4005" })).toHaveAttribute(
    "href",
    "tel:+2348103704005",
  );
  await expect(page.getByRole("link", { name: "Start a conversation" })).toHaveAttribute(
    "href",
    "https://wa.me/2348103704005",
  );
  await expect(page.getByText(/Suite A108, Garki Mall/).first()).toBeVisible();
});

test("inspection requests carry scheduling and property context", async ({ page }) => {
  let submitted: Record<string, string> | undefined;
  await page.route("**/api/enquiries", async (route) => {
    submitted = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Enquiry received." }),
    });
  });
  await page.goto("/book-inspection?property=DMZ-KYC-001");

  await page.getByLabel("Full name").fill("Ada Buyer");
  await page.getByLabel("Email address").fill("ada@example.com");
  await page.getByLabel("Phone or WhatsApp").fill("+2348000000000");
  await page.getByLabel("Inspection preference").selectOption("Live video inspection");
  await page.getByLabel("Preferred date").fill("2026-10-15");
  await page.getByLabel("Alternate date").fill("2026-10-16");
  await page.getByLabel("Your time zone").fill("GMT");
  await page.getByLabel("Property requirements or details").fill(
    "Please show the plot access and surrounding development.",
  );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Request inspection" }).click();

  await expect(page.getByRole("status")).toContainText("has been received");
  expect(submitted).toMatchObject({
    interest: "Booking an inspection",
    propertyReference: "DMZ-KYC-001",
    inspectionPreference: "Live video inspection",
    inspectionDate: "2026-10-15",
    alternateDate: "2026-10-16",
    timeZone: "GMT",
  });
});

test("buyer guide is available in print layout", async ({ page }) => {
  await page.goto("/guides/kyc-homes-phase-ii-buyer-guide");
  await expect(
    page.getByRole("heading", { name: "A clearer route from interest to ownership." }),
  ).toBeVisible();
  await expect(page.getByText("NGN 14,000,000", { exact: true })).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".buyer-checklist")).toBeVisible();
});

test("insight topic pages provide crawlable article links", async ({ page }) => {
  await page.goto("/insights/topics/area-guide");
  await expect(page.getByRole("heading", { name: "Area guide" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A practical guide to KYC Homes Phase II, Abuja" }),
  ).toBeVisible();
});

test("estate gallery filters images and opens an accessible viewer", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await expect(page.getByText("2 photographs", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /View larger:/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});

test("unconfigured admin routes fail safely into setup guidance", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?setup=required$/);
  await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Supabase setup required" })).toBeVisible();
  await expect(page.locator(".site-header")).toBeHidden();
});

for (const path of [
  "/",
  "/properties",
  "/areas/kyc-homes-phase-ii",
  "/contact",
  "/guides/kyc-homes-phase-ii-buyer-guide",
  "/properties/600sqm-virgin-land-kyc-homes-phase-ii",
  "/gallery",
  "/book-inspection",
  "/admin/login",
]) {
  test(`${path} has no automatically detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
