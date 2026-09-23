import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublishedArticle, getPublishedArticles } from "../src/lib/public-articles";
import { articles } from "../src/lib/content";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("public editorial source", () => {
  it("keeps repository content available before database publishing is enabled", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "repository");
    expect(await getPublishedArticles()).toEqual(articles);
  });

  it("reads only published database articles and maps public fields", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "database");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      slug: "new-article",
      title: "New buyer guide",
      category: "Buying guide",
      excerpt: "A practical guide to property purchase checks.",
      body: [{ heading: "Check the facts", body: "Confirm all title and seller details before you pay." }],
      read_time_minutes: 2,
      published_at: "2026-09-23T08:00:00Z",
      updated_at: "2026-09-23T09:00:00Z",
      seo_title: "A better SEO title",
      seo_description: null,
    }]), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    const result = await getPublishedArticle("new-article");
    expect(result).toMatchObject({
      slug: "new-article",
      publishedAt: "2026-09-23",
      readTime: "2 min read",
      seoTitle: "A better SEO title",
    });
    const request = fetcher.mock.calls[0];
    expect(String(request[0])).toContain("status=eq.published");
    expect(String(request[0])).toContain("slug=eq.new-article");
    expect(request[1].headers.apikey).toBe("public-key");
  });

  it("does not silently serve stale file content if the database fails", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "database");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(getPublishedArticles()).rejects.toThrow("Published property insights are unavailable");
  });
});
