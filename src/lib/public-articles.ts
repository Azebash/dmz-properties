import "server-only";

import { articles as repositoryArticles, type Article } from "@/lib/content";
import type { ArticleRow } from "@/lib/supabase/types";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function usesDatabaseContent() {
  const source = process.env.SUPABASE_CONTENT_SOURCE;
  if (source === "repository") return false;
  if (source === "database") return true;
  if (!source && (process.env.NODE_ENV !== "production" || !process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return false;
  }
  throw new Error("SUPABASE_CONTENT_SOURCE must be database or repository");
}

export function articleFromRow(row: ArticleRow): Article {
  if (!Array.isArray(row.body)) throw new Error("An article is missing sections");
  const sections = row.body.map((item) => {
    if (
      !item || typeof item !== "object" || Array.isArray(item) ||
      typeof item.heading !== "string" || typeof item.body !== "string"
    ) throw new Error("A published article has invalid sections");
    return { heading: item.heading, body: item.body };
  });
  if (!sections.length) throw new Error("A published article has no sections");

  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    readTime: `${row.read_time_minutes} min read`,
    publishedAt: (row.published_at || row.created_at).slice(0, 10),
    updatedAt: row.updated_at.slice(0, 10),
    sections,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
  };
}

function parsePublishedArticle(row: ArticleRow): Article {
  if (!row.published_at) throw new Error("A published article is missing publication data");
  return articleFromRow(row);
}

async function fetchArticles(filters = "") {
  const { url, publishableKey } = getSupabaseConfig();
  const endpoint = new URL("/rest/v1/articles", url);
  endpoint.search = `select=*&status=eq.published&${filters}`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    next: { revalidate: 60, tags: ["published-articles"] },
  });
  if (!response.ok) throw new Error("Published property insights are unavailable");
  return (await response.json() as ArticleRow[]).map(parsePublishedArticle);
}

export async function getPublishedArticles(): Promise<Article[]> {
  if (!usesDatabaseContent()) return repositoryArticles;
  return fetchArticles("order=published_at.desc,slug.asc&limit=500");
}

export async function getPublishedArticle(slug: string): Promise<Article | undefined> {
  if (!usesDatabaseContent()) {
    return repositoryArticles.find((article) => article.slug === slug);
  }
  const results = await fetchArticles(`slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return results[0];
}
