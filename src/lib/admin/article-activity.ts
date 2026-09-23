import type { Json } from "@/lib/supabase/database.types";

const editorialFields = {
  title: "Title",
  slug: "URL slug",
  category: "Topic",
  excerpt: "Search and listing summary",
  body: "Article sections",
  read_time_minutes: "Estimated reading time",
  seo_title: "Search title",
  seo_description: "Search description",
} as const;

function objectValue(value: Json | null): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

export function articleActivityDetail(
  action: string,
  previousValue: Json | null,
  nextValue: Json | null,
) {
  const previous = objectValue(previousValue);
  const next = objectValue(nextValue);
  if (action === "status_changed" && previous && next &&
    typeof previous.status === "string" && typeof next.status === "string") {
    return `Stage: ${previous.status.replaceAll("_", " ")} → ${next.status.replaceAll("_", " ")}`;
  }
  if (action !== "updated" || !previous || !next) return null;

  const changed = Object.entries(editorialFields)
    .filter(([field]) => JSON.stringify(previous[field]) !== JSON.stringify(next[field]))
    .map(([, label]) => label);
  return changed.length ? `Changed: ${changed.join(", ")}` : "Saved without content changes";
}
