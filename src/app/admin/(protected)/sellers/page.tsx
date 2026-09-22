import type { Metadata } from "next";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate, formatAdminMoney } from "@/lib/admin/format";
import { listAdminSellerSubmissions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Seller Reviews" };

export default async function AdminSellersPage() {
  const submissions = await listAdminSellerSubmissions();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Owner resales</p>
        <h1>Seller reviews</h1>
        <p>Private ownership and authority-to-sell review queue.</p>
      </header>
      {submissions.length ? (
        <div className="admin-table-wrap"><table className="admin-table">
          <caption>Seller review queue</caption>
          <thead><tr><th>Owner</th><th>Property</th><th>Asking price</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>{submissions.map((submission) => <tr key={submission.id}>
            <td><strong>{submission.owner_name}</strong><span>{submission.owner_phone}</span></td>
            <td>{submission.property_description}</td>
            <td>{formatAdminMoney(submission.asking_price)}</td>
            <td><AdminStatus value={submission.status} /></td>
            <td>{formatAdminDate(submission.created_at)}</td>
          </tr>)}</tbody>
        </table></div>
      ) : <AdminEmpty message="Submitted owner properties will appear here for verification." />}
    </div>
  );
}
