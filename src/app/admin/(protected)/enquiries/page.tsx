import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate } from "@/lib/admin/format";
import { followUpLabel, lagosToday } from "@/lib/admin/follow-ups";
import { requireStaff } from "@/lib/admin/auth";
import { listAdminEnquiries, listDueEnquiryFollowUps } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage() {
  const [enquiries, due, staff] = await Promise.all([
    listAdminEnquiries(), listDueEnquiryFollowUps(), requireStaff(),
  ]);
  const today = lagosToday();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Lead management</p>
        <h1>Enquiries</h1>
        <p>Qualified buyer, seller, inspection, and general conversations.</p>
      </header>
      <section className="admin-due-follow-ups" id="due-follow-ups" aria-labelledby="due-follow-ups-heading">
        <h2 id="due-follow-ups-heading">Follow-ups due</h2>
        <p>Due today or overdue in Abuja time. Reminders are visible here; they do not send email or messages.</p>
        {due.length ? (
          <ul>
            {due.map((enquiry) => (
              <li key={enquiry.id}>
                <Link href={`/admin/enquiries/${enquiry.id}`}>{enquiry.name}</Link>
                <span>{enquiry.property_reference || "General enquiry"}</span>
                <strong className="admin-follow-up" data-due={enquiry.follow_up_on && enquiry.follow_up_on < today ? "overdue" : "scheduled"}>
                  {followUpLabel(enquiry.follow_up_on, today)}
                </strong>
                <span>{!enquiry.assigned_to ? "Unassigned" : enquiry.assigned_to === staff.user_id
                  ? "Assigned to you" : "Assigned teammate"}</span>
              </li>
            ))}
          </ul>
        ) : <p>No follow-ups due today.</p>}
        {due.length === 100 ? <p>Showing the earliest 100 due follow-ups. Clear completed reminders to reveal later items.</p> : null}
      </section>
      {enquiries.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption>Latest enquiries</caption>
            <thead><tr><th>Contact</th><th>Type</th><th>Property</th><th>Status</th><th>Follow-up</th><th>Received</th></tr></thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td><strong><Link href={`/admin/enquiries/${enquiry.id}`}>{enquiry.name}</Link></strong><span>{enquiry.email}</span><span>{enquiry.phone}</span></td>
                  <td>{enquiry.enquiry_type}</td>
                  <td>{enquiry.property_reference || "General"}</td>
                  <td><AdminStatus value={enquiry.status} /></td>
                  <td><span className="admin-follow-up" data-due={enquiry.follow_up_on && enquiry.follow_up_on < today ? "overdue" : "scheduled"}>
                    {followUpLabel(enquiry.follow_up_on, today)}
                  </span></td>
                  <td>{formatAdminDate(enquiry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <AdminEmpty message="New buyer and seller enquiries will appear here." />}
    </div>
  );
}
