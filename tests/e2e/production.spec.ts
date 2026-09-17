import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const metrics = { cls: 0, lcp: 0 };
    Object.defineProperty(window, "__dmzMetrics", { value: metrics });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        };
        if (!shift.hadRecentInput) metrics.cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) metrics.lcp = entries.at(-1)?.startTime || 0;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
});

test("production homepage meets basic performance and asset budgets", async ({ page }) => {
  const failedResponses: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(750);

  const result = await page.evaluate(() => {
    const metrics = (
      window as typeof window & { __dmzMetrics: { cls: number; lcp: number } }
    ).__dmzMetrics;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const imageFailures = Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);

    return {
      ...metrics,
      transferredBytes: resources.reduce((total, entry) => total + entry.transferSize, 0),
      imageFailures,
    };
  });

  expect(failedResponses).toEqual([]);
  expect(result.imageFailures).toEqual([]);
  expect(result.cls).toBeLessThanOrEqual(0.1);
  expect(result.lcp).toBeLessThan(4_000);
  expect(result.transferredBytes).toBeLessThan(4_000_000);
});

test("production metadata and discovery endpoints are valid", async ({ page, request }) => {
  await page.goto("/areas/kyc-homes-phase-ii");

  await expect(page).toHaveTitle(/KYC Homes Phase II, Abuja/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Sabon Lugbe/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/areas\/kyc-homes-phase-ii$/,
  );

  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(structuredData.length).toBeGreaterThan(0);
  for (const value of structuredData) expect(() => JSON.parse(value)).not.toThrow();

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/areas/kyc-homes-phase-ii");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap:");
});
