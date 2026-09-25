import { chromium, expect } from "@playwright/test";

const site = "https://dmz-properties.vercel.app";
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${site}/properties?maxPrice=14000000&minSize=600&sort=price_asc`);
    await expect(page.getByLabel("Maximum price (NGN)")).toHaveValue("14000000");
    await expect(page.getByLabel("Minimum plot size (sqm)")).toHaveValue("600");
    await expect(page.getByLabel("Sort by")).toHaveValue("price_asc");
    await expect(page.getByText("1 property", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "600 sqm Virgin Land" })).toBeVisible();
    await expect(page.getByText("Availability to confirm")).toBeVisible();
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) {
      throw new Error("Catalogue filters overflow the viewport");
    }
    await page.getByLabel("Sort by").selectOption("relevance");
    await page.goBack();
    await expect(page.getByLabel("Sort by")).toHaveValue("price_asc");
    await page.getByLabel("Availability check").selectOption("available");
    await expect(page.getByRole("heading", { name: "No matching properties" })).toBeVisible();
    await page.getByLabel("Availability check").selectOption("unconfirmed");
    await expect(page.getByText("1 property", { exact: true })).toBeVisible();
    await page.getByLabel("Maximum price (NGN)").fill("10000000");
    await expect(page.getByRole("heading", { name: "No matching properties" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "No matching properties" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText("1 property", { exact: true })).toBeVisible();
    await page.close();
  }
  console.log("Live catalogue ranges, sorting, shareable URLs, back navigation and responsive layout verified");
} finally {
  await browser.close();
}
