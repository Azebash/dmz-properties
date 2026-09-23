"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { articlePayloadFromFormData } from "@/lib/admin/article-validation";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { categorySlug } from "@/lib/content";

type PublicationStatus = Database["public"]["Enums"]["publication_status"];
export type ArticleActionState = { error: string };

function canEdit(role: string) {
  return role === "administrator" || role === "content_editor";
}

function revalidateArticle(slug: string, category: string) {
  updateTag("published-articles");
  for (const path of [
    "/",
    "/insights",
    "/areas/kyc-homes-phase-ii",
    "/sitemap.xml",
    `/insights/${slug}`,
    `/insights/topics/${categorySlug(category)}`,
  ]) revalidatePath(path);
}

export async function saveArticleAction(
  _previous: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const staff = await requireStaff();
  if (!canEdit(staff.role)) return { error: "Your role cannot edit articles." };
  const parsed = articlePayloadFromFormData(formData);
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_article", {
    p_payload: parsed.payload,
  });
  if (error || !data) {
    return {
      error: error?.code === "23505"
        ? "Another article already uses this URL slug."
        : error?.code === "23514"
          ? "Check all required fields and keep a published article’s URL unchanged."
          : "The article could not be saved. Please try again.",
    };
  }

  const { data: article } = await supabase
    .from("articles")
    .select("slug,category")
    .eq("id", data)
    .single();
  if (article) revalidateArticle(article.slug, article.category);
  revalidatePath("/admin/content");
  revalidatePath("/admin");
  redirect(`/admin/content/${data}/edit?saved=1`);
}

export async function transitionArticleAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canEdit(staff.role)) redirect("/admin/access-denied");
  const id = String(formData.get("articleId") || "");
  const status = String(formData.get("status") || "") as PublicationStatus;
  const allowed: PublicationStatus[] = ["draft", "under_review", "published", "archived"];
  if (!uuidPattern.test(id) || !allowed.includes(status)) redirect("/admin/content");

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_article_status", {
    p_article_id: id,
    p_status: status,
  });
  if (!error) {
    const { data: article } = await supabase
      .from("articles")
      .select("slug,category")
      .eq("id", id)
      .single();
    if (article) revalidateArticle(article.slug, article.category);
  }
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}/edit`);
  redirect(`/admin/content/${id}/edit?transition=${error ? "failed" : "saved"}`);
}
