import type { Metadata } from "next";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate } from "@/lib/admin/format";
import { listAdminArticles } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentPage() {
  const articles = await listAdminArticles();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Publishing</p>
        <h1>Content</h1>
        <p>Draft, review, published, and archived property guidance.</p>
      </header>
      {articles.length ? (
        <div className="admin-table-wrap"><table className="admin-table">
          <caption>Article catalogue</caption>
          <thead><tr><th>Article</th><th>Category</th><th>Status</th><th>Published</th><th>Updated</th></tr></thead>
          <tbody>{articles.map((article) => <tr key={article.id}>
            <td><strong>{article.title}</strong><span>/{article.slug}</span></td>
            <td>{article.category}</td>
            <td><AdminStatus value={article.status} /></td>
            <td>{formatAdminDate(article.published_at)}</td>
            <td>{formatAdminDate(article.updated_at)}</td>
          </tr>)}</tbody>
        </table></div>
      ) : <AdminEmpty message="Articles will appear here after database publishing is enabled." />}
    </div>
  );
}
