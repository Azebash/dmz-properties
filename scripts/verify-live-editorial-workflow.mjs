import { chromium, expect } from "@playwright/test";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dmz-properties.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.DMZ_ADMIN_EMAIL;
const password = process.env.DMZ_ADMIN_TEMP_PASSWORD;

if (!site.startsWith("https://") || !supabaseUrl || !secret || !publishable || !email || !password) {
  throw new Error("Live editorial verification needs HTTPS and local admin/Supabase credentials");
}

const databaseUrl = `${supabaseUrl}/rest/v1`;
const slug = `editorial-verification-${Date.now()}`;
const title = "Temporary editorial publishing verification";
let articleId;
let browser;

async function request(path, options = {}) {
  const response = await fetch(`${databaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Database ${options.method || "GET"} failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

try {
  browser = await chromium.launch({ headless: true });
  const admin = await browser.newPage();
  await admin.goto(`${site}/admin/login`, { waitUntil: "networkidle" });
  await admin.getByLabel("Staff email").fill(email);
  await admin.getByLabel("Password").fill(password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/, { timeout: 30_000 });

  await admin.goto(`${site}/admin/content/new`, { waitUntil: "networkidle" });
  await admin.getByLabel("Title", { exact: true }).fill(title);
  await admin.getByLabel("URL slug").fill(slug);
  await admin.getByLabel("Topic").fill("Editorial verification");
  await admin.getByLabel("Search and listing summary").fill(
    "A temporary guide that verifies the DMZ editorial publishing workflow end to end.",
  );
  await admin.getByLabel("Custom SEO title (optional)").fill("Editorial verification | DMZ Properties");
  await admin.getByLabel("Custom SEO description (optional)").fill(
    "Check the DMZ editorial publishing and search metadata workflow.",
  );
  await admin.getByLabel("Heading").fill("A clear first section");
  await admin.getByLabel("Body", { exact: true }).fill(
    "This temporary article verifies that published content comes from Supabase, not repository files.",
  );
  await admin.getByRole("button", { name: "Create draft" }).click();
  await admin.waitForURL(/\/admin\/content\/[^/]+\/edit\?saved=1/, { timeout: 30_000 });
  articleId = admin.url().match(/content\/([^/]+)\/edit/)?.[1];
  if (!articleId) throw new Error("Article draft ID missing");
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("draft");
  const activity = admin.getByRole("region", { name: "Audit history" });
  await expect(activity).toContainText("created");
  await expect(activity).toContainText("By Hafiz Bashir");
  const publicUrl = `${site}/insights/${slug}`;
  const previewUrl = `${site}/admin/content/${articleId}/preview`;
  const reader = await browser.newPage();
  await reader.goto(previewUrl);
  await expect(reader).toHaveURL(/\/admin\/login/);
  if ((await reader.goto(publicUrl))?.status() !== 404) {
    throw new Error("Draft was served on its public article URL");
  }

  await admin.getByRole("link", { name: "Preview saved article" }).click();
  await expect(admin).toHaveURL(previewUrl);
  await expect(admin.locator(".article-preview-bar")).toContainText("Staff preview · draft");
  await expect(admin.locator(".article-preview-bar")).toContainText(
    "Search title: Editorial verification | DMZ Properties",
  );
  await expect(admin.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(admin.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(admin.getByRole("heading", { name: "A clear first section" })).toBeVisible();
  await admin.getByRole("link", { name: "Back to editor" }).click();
  await expect(admin.getByRole("heading", { name: "Edit article" })).toBeVisible();

  const publicHeaders = {
    apikey: publishable,
    Authorization: `Bearer ${publishable}`,
  };
  const draftResponse = await fetch(
    `${databaseUrl}/articles?status=eq.published&slug=eq.${slug}&select=id`,
    { headers: publicHeaders },
  );
  if (!draftResponse.ok || (await draftResponse.json()).length !== 0) {
    throw new Error("Draft article was exposed to anonymous visitors");
  }

  await admin.getByRole("button", { name: "Move to under review" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("under review", { timeout: 30_000 });
  await expect(activity).toContainText("Stage: draft → under review");
  await admin.getByRole("link", { name: "Preview saved article" }).click();
  await expect(admin.locator(".article-preview-bar")).toContainText("Staff preview · under review");
  await admin.getByRole("link", { name: "Back to editor" }).click();
  await admin.getByRole("button", { name: "Move to published" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("published", { timeout: 30_000 });

  await expect.poll(async () => {
    const response = await reader.goto(publicUrl);
    return response?.status();
  }, { timeout: 30_000 }).toBe(200);
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(reader.locator('link[rel="canonical"]')).toHaveAttribute("href", publicUrl);
  await expect(reader).toHaveTitle(/Editorial verification \| DMZ Properties/);
  await expect(reader.locator('meta[name="description"]')).toHaveAttribute(
    "content", "Check the DMZ editorial publishing and search metadata workflow.",
  );
  await reader.goto(`${site}/insights/topics/editorial-verification`);
  await expect(reader.getByRole("link", { name: title })).toHaveAttribute("href", `/insights/${slug}`);
  await expect.poll(async () => {
    const response = await fetch(`${site}/sitemap.xml`);
    return (await response.text()).includes(publicUrl);
  }, { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => {
    const response = await fetch(`${site}/insights`);
    return (await response.text()).includes(`/insights/${slug}`);
  }, { timeout: 90_000 }).toBe(true);
  await expect.poll(async () => {
    const response = await fetch(site);
    return (await response.text()).includes(`/insights/${slug}`);
  }, { timeout: 90_000 }).toBe(true);

  await admin.getByLabel("Title", { exact: true }).fill("Updated editorial publishing verification");
  await admin.getByLabel("Custom SEO title (optional)").fill("Updated editorial verification | DMZ Properties");
  await admin.getByRole("button", { name: "Save article" }).click();
  await admin.waitForURL(/\?saved=1/, { timeout: 30_000 });
  await expect.poll(async () => {
    await reader.goto(publicUrl);
    return reader.getByRole("heading", { level: 1 }).textContent();
  }, { timeout: 30_000 }).toBe("Updated editorial publishing verification");
  await expect(reader).toHaveTitle(/Updated editorial verification \| DMZ Properties/);
  await expect(activity).toContainText("Changed: Title, Search title");

  await admin.getByRole("button", { name: "Move to archived" }).click();
  await expect(admin.locator(".admin-edit-header .admin-status")).toHaveText("archived", { timeout: 30_000 });
  await expect(activity).toContainText("Stage: published → archived");
  await expect.poll(async () => (await reader.goto(publicUrl))?.status(), {
    timeout: 30_000,
  }).toBe(404);
  await expect.poll(async () => {
    const response = await fetch(`${site}/sitemap.xml`);
    return (await response.text()).includes(publicUrl);
  }, { timeout: 30_000 }).toBe(false);
  await expect.poll(async () => {
    const response = await fetch(`${site}/insights`);
    return (await response.text()).includes(`/insights/${slug}`);
  }, { timeout: 90_000 }).toBe(false);
  await expect.poll(async () => {
    const response = await fetch(site);
    return (await response.text()).includes(`/insights/${slug}`);
  }, { timeout: 90_000 }).toBe(false);

  const audits = await request(`/audit_events?entity_type=eq.article&entity_id=eq.${articleId}&select=id,action`);
  if (audits.length !== 5) throw new Error(`Expected 5 audit records, found ${audits.length}`);
  console.log(JSON.stringify({ created: true, published: true, edited: true, archived: true, audits: 5 }));
} finally {
  await browser?.close();
  const created = await request(`/articles?slug=eq.${slug}&select=id`);
  articleId ||= created[0]?.id;
  if (articleId) {
    await request(`/audit_events?entity_type=eq.article&entity_id=eq.${articleId}`, { method: "DELETE" });
    await request(`/articles?id=eq.${articleId}`, { method: "DELETE" });
    const remaining = await request(`/articles?id=eq.${articleId}&select=id`);
    if (remaining.length) throw new Error("Temporary editorial verification article was not removed");
    console.log("Temporary editorial records removed");
  }
}
