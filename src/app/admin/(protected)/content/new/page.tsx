import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminArticleForm } from "@/components/admin-article-form";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage() {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "content_editor") {
    redirect("/admin/access-denied");
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Publishing / New</p>
        <h1>Create article</h1>
        <p>Start as a draft, review the content, and publish when ready.</p>
      </header>
      <AdminArticleForm />
    </div>
  );
}
