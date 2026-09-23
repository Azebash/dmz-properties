import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { transitionArticleAction } from "@/app/admin/(protected)/content/actions";
import { AdminArticleForm } from "@/components/admin-article-form";
import { AdminStatus } from "@/components/admin-status";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { getAdminArticle } from "@/lib/admin/queries";
import type { Database } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Edit Article" };

type Status = Database["public"]["Enums"]["publication_status"];
const transitions: Record<Status, Status[]> = {
  draft: ["under_review", "archived"],
  under_review: ["draft", "published", "archived"],
  published: ["under_review", "archived"],
  archived: ["draft"],
};

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; transition?: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const [staff, article, query] = await Promise.all([
    requireStaff(), getAdminArticle(id), searchParams,
  ]);
  if (!article) notFound();
  if (staff.role !== "administrator" && staff.role !== "content_editor") {
    redirect("/admin/access-denied");
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-edit-header">
        <div>
          <p className="eyebrow"><Link href="/admin/content">Content</Link> / {article.slug}</p>
          <h1>Edit article</h1>
        </div>
        <AdminStatus value={article.status} />
      </header>
      {query.saved === "1" ? <p className="admin-success" role="status">Article saved.</p> : null}
      {query.transition === "saved" ? <p className="admin-success" role="status">Publication status updated.</p> : null}
      {query.transition === "failed" ? (
        <p className="admin-auth-error" role="alert">This publication transition is not allowed.</p>
      ) : null}
      <AdminArticleForm article={article} />

      <section className="admin-transitions">
        <h2>Publication workflow</h2>
        <p>Stage changes are validated and recorded in the audit history.</p>
        <div>
          {transitions[article.status].map((status) => (
            <form key={status} action={transitionArticleAction}>
              <input name="articleId" type="hidden" value={article.id} />
              <input name="status" type="hidden" value={status} />
              <button className="button button-secondary" type="submit">
                Move to {status.replaceAll("_", " ")}
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
