import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminArticleForm } from "@/components/admin-article-form";
import { requireStaff } from "@/lib/admin/auth";
import { estateUpdateCategory } from "@/lib/content";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "content_editor") {
    redirect("/admin/access-denied");
  }
  const isEstateUpdate = (await searchParams).category === "estate-update";

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Publishing / New</p>
        <h1>{isEstateUpdate ? "Create estate update" : "Create article"}</h1>
        <p>Start as a draft, review the content, and publish when ready.</p>
      </header>
      <AdminArticleForm initialCategory={isEstateUpdate ? estateUpdateCategory : undefined} />
    </div>
  );
}
