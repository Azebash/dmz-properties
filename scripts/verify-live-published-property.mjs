import { chromium, expect } from "@playwright/test";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dmz-properties.vercel.app";
if (!site.startsWith("https://")) throw new Error("Published listing verification requires HTTPS");

const slug = "600sqm-virgin-land-kyc-homes-phase-ii";
const propertyUrl = `${site}/properties/${slug}`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(site);
  await expect(page.getByRole("link", { name: "600 sqm Virgin Land" })).toBeVisible();

  await page.goto(`${site}/properties`);
  await expect(page.getByRole("link", { name: "600 sqm Virgin Land" })).toBeVisible();
  await page.goto(propertyUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("600 sqm Virgin Land");
  await expect(page.locator(".detail-price")).toHaveText("NGN 14,000,000");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", propertyUrl);
  await expect(page.getByText("2026-09-22", { exact: true })).toBeVisible();
  await expect(page.getByText(/photographs show the estate, not an individual virgin-land plot/i)).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Sabon Lugbe/);
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const listing = scripts.map((script) => JSON.parse(script))
    .find((entry) => entry["@type"] === "RealEstateListing");
  if (listing?.offers?.price !== 14000000 || listing?.offers?.priceCurrency !== "NGN") {
    throw new Error("Published listing structured price does not match its visible offer");
  }

  await page.goto(`${site}/areas/kyc-homes-phase-ii`);
  await expect(page.getByRole("link", { name: "600 sqm Virgin Land" })).toBeVisible();
  await expect(page.getByText(/600 sqm virgin land \/ NGN 14,000,000/)).toBeVisible();
  await page.goto(`${site}/faqs`);
  await expect(page.getByText(/currently listed KYC Interproject Limited price is NGN 14,000,000/)).toBeVisible();
  await page.goto(`${site}/guides/kyc-homes-phase-ii-buyer-guide`);
  await expect(page.getByText("NGN 14,000,000", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore available land" })).toHaveAttribute("href", `/properties/${slug}`);
  await page.goto(`${site}/insights/kyc-homes-phase-ii-abuja-guide`);
  await expect(page.getByRole("heading", { name: "Developer product at publication" })).toBeVisible();

  const sitemap = await fetch(`${site}/sitemap.xml`);
  if (!sitemap.ok || !(await sitemap.text()).includes(propertyUrl)) {
    throw new Error("Published developer listing is missing from the sitemap");
  }
  const robots = await fetch(`${site}/robots.txt`);
  if (!robots.ok || !(await robots.text()).includes("Disallow: /")) {
    throw new Error("Search indexing changed before launch approval");
  }
  console.log("Published listing URL, context media, price, metadata, articles and discovery paths verified");
} finally {
  await browser.close();
}
