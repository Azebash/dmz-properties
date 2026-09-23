import type { Json } from "@/lib/supabase/database.types";

export type ArticlePayloadResult =
  | { success: true; payload: Json }
  | { success: false; error: string };

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function articlePayloadFromFormData(formData: FormData): ArticlePayloadResult {
  const id = field(formData, "id");
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const category = field(formData, "category");
  const excerpt = field(formData, "excerpt");
  const readTimeMinutes = Number(field(formData, "readTimeMinutes"));

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return { success: false, error: "Use a lowercase URL slug with hyphens (up to 120 characters)." };
  }
  if (title.length < 5 || title.length > 160 || category.length < 2 || category.length > 100 || excerpt.length < 20 || excerpt.length > 500) {
    return { success: false, error: "Check the article title, category, and summary lengths." };
  }
  if (!Number.isInteger(readTimeMinutes) || readTimeMinutes < 1 || readTimeMinutes > 30) {
    return { success: false, error: "Estimated reading time must be between 1 and 30 minutes." };
  }

  const sections = [];
  for (let index = 1; index <= 12; index += 1) {
    const heading = field(formData, `sectionHeading${index}`);
    const body = field(formData, `sectionBody${index}`);
    if (!heading && !body) continue;
    if (heading.length < 3 || heading.length > 140 || body.length < 30 || body.length > 6000) {
      return { success: false, error: `Section ${index} needs a heading and at least 30 characters of body text.` };
    }
    sections.push({ heading, body });
  }
  if (!sections.length) return { success: false, error: "Add at least one complete article section." };

  return {
    success: true,
    payload: {
      id,
      slug,
      title,
      category,
      excerpt,
      readTimeMinutes,
      sections,
      seoTitle: field(formData, "seoTitle"),
      seoDescription: field(formData, "seoDescription"),
    },
  };
}
