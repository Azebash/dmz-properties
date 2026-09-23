import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { requireStaff } from "@/lib/admin/auth";
import { formatAdminDate } from "@/lib/admin/format";
import { listAdminArticles } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentPage() {
  const [articles, staff] = await Promise.all([listAdminArticles(), requireStaff()]);
  const canEdit = staff.role === "administrator" || staff.role === "content_editor";
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Publishing</p>
        <h1>Content</h1>
        <p>Draft, review, published, and archived property guidance.</p>
        {canEdit ? (
          <div className="button-row admin-content-actions">
            <Link className="button button-primary" href="/admin/content/new">Add article</Link>
            <Link className="button button-secondary" href="/admin/content/new?category=estate-update">
              Add estate update
            </Link>
          </div>
        ) : null}
      </header>
      {articles.length ? (
        <div className="admin-table-wrap"><table className="admin-table">
          <caption>Article catalogue</caption>
          <thead><tr><th>Article</th><th>Category</th><th>Status</th><th>Published</th><th>Updated</th></tr></thead>
          <tbody>{articles.map((article) => <tr key={article.id}>
            <td>
              <strong><Link href={`/admin/content/${article.id}/edit`}>{article.title}</Link></strong>
              <span>/{article.slug}</span>
            </td>
            <td>{article.category}</td>
            <td><AdminStatus value={article.status} /></td>
            <td>{formatAdminDate(article.published_at)}</td>
            <td>{formatAdminDate(article.updated_at)}</td>
          </tr>)}</tbody>
        </table></div>
      ) : <AdminEmpty message="Create an article draft to begin building your property insights." />}
    </div>
  );
}
