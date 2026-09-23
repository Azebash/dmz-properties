import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleContent } from "@/components/article-content";
import { requireStaff } from "@/lib/admin/auth";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { getAdminArticle } from "@/lib/admin/queries";
import { articleFromRow } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff article preview",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "content_editor") {
    redirect("/admin/access-denied");
  }
  const row = await getAdminArticle(id);
  if (!row) notFound();
  const article = articleFromRow(row);

  return (
    <main>
      <div className="article-preview-bar section-shell" role="status">
        <div>
          <strong>Staff preview · {row.status.replaceAll("_", " ")}</strong>
          <p>This is the saved version. Changes in the editor must be saved to appear here.</p>
          {row.status !== "published" ? <p>This article is not publicly available.</p> : null}
          <p>Search title: {article.seoTitle || article.title}</p>
          <p>Search description: {article.seoDescription || article.excerpt}</p>
        </div>
        <Link className="button button-secondary" href={`/admin/content/${id}/edit`}>
          Back to editor
        </Link>
      </div>
      <ArticleContent article={article} preview={row.status !== "published"} />
    </main>
  );
}
