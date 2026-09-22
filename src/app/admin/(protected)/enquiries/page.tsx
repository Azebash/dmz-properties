import type { Metadata } from "next";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate } from "@/lib/admin/format";
import { listAdminEnquiries } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage() {
  const enquiries = await listAdminEnquiries();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Lead management</p>
        <h1>Enquiries</h1>
        <p>Qualified buyer, seller, inspection, and general conversations.</p>
      </header>
      {enquiries.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption>Latest enquiries</caption>
            <thead><tr><th>Contact</th><th>Type</th><th>Property</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td><strong>{enquiry.name}</strong><span>{enquiry.email}</span><span>{enquiry.phone}</span></td>
                  <td>{enquiry.enquiry_type}</td>
                  <td>{enquiry.property_reference || "General"}</td>
                  <td><AdminStatus value={enquiry.status} /></td>
                  <td>{formatAdminDate(enquiry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <AdminEmpty message="New website enquiries will appear here after persistence is enabled." />}
    </div>
  );
}
