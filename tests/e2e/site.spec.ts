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

  await expect(page).toHaveURL(/\/areas\/kyc-homes-phase-ii$/);
  await expect(
    page.getByRole("heading", { name: "KYC Homes Phase II, understood from within." }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("property discovery filters and carries listing context into an enquiry", async ({
  page,
}) => {
  await page.goto("/properties");

  await page.getByLabel("Search properties").fill("DMZ-KYC-002");
  await expect(page.getByText("1 property", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Owner Resale Plot" }).click();

  await expect(page).toHaveURL(/\/properties\/client-resale-plot-kyc-homes-phase-ii$/, {
    timeout: 20_000,
  });
  await expect(page.getByText("DMZ-KYC-002", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Enquire about this property" }).click();
  await expect(page).toHaveURL(/property=DMZ-KYC-002/);
  await expect(page.locator(".form-property")).toContainText("DMZ-KYC-002");
});

test("enquiry form submits a qualified buyer request", async ({ page }) => {
  await page.route("**/api/enquiries", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Enquiry received." }),
    });
  });
  await page.goto("/contact");

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
});

for (const path of ["/", "/properties", "/areas/kyc-homes-phase-ii", "/contact"]) {
  test(`${path} has no automatically detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
