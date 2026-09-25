import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate } from "@/lib/admin/format";
import {
  enquiryInboxPageSize, followUpLabel, lagosToday, parseEnquiryPage, parseFollowUpPage,
} from "@/lib/admin/follow-ups";
import { requireStaff } from "@/lib/admin/auth";
import { listAdminEnquiries, listDueEnquiryFollowUps } from "@/lib/admin/queries";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  const params = await searchParams;
  const requestedFollowUpPage = parseFollowUpPage(params.followUpPage);
  const requestedInboxPage = parseEnquiryPage(params.inboxPage);
  const [enquiries, due, staff] = await Promise.all([
    listAdminEnquiries(requestedInboxPage), listDueEnquiryFollowUps(requestedFollowUpPage), requireStaff(),
  ]);
  const today = lagosToday();
  const followUpPageCount = Math.max(1, Math.ceil(due.total / due.pageSize));
  const inboxPageCount = Math.max(1, Math.ceil(enquiries.total / enquiryInboxPageSize));
  const href = (section: "follow-ups" | "inbox", page: number) => {
    const query = new URLSearchParams();
    const inboxPage = section === "inbox" ? page : requestedInboxPage;
    const followUpPage = section === "follow-ups" ? page : requestedFollowUpPage;
    if (inboxPage > 1) query.set("inboxPage", String(inboxPage));
    if (followUpPage > 1) query.set("followUpPage", String(followUpPage));
    const search = query.toString();
    const anchor = section === "follow-ups" ? "due-follow-ups" : "latest-enquiries";
    return `/admin/enquiries${search ? `?${search}` : ""}#${anchor}`;
  };
  if (requestedFollowUpPage > followUpPageCount || requestedInboxPage > inboxPageCount) {
    const normalizedInboxPage = Math.min(requestedInboxPage, inboxPageCount);
    const normalizedFollowUpPage = Math.min(requestedFollowUpPage, followUpPageCount);
    const query = new URLSearchParams();
    if (normalizedInboxPage > 1) query.set("inboxPage", String(normalizedInboxPage));
    if (normalizedFollowUpPage > 1) query.set("followUpPage", String(normalizedFollowUpPage));
    redirect(`/admin/enquiries${query.size ? `?${query}` : ""}#${requestedInboxPage > inboxPageCount ? "latest-enquiries" : "due-follow-ups"}`);
  }
  const firstDueItem = due.total ? (requestedFollowUpPage - 1) * due.pageSize + 1 : 0;
  const lastDueItem = Math.min(requestedFollowUpPage * due.pageSize, due.total);
  const firstEnquiry = enquiries.total ? (requestedInboxPage - 1) * enquiryInboxPageSize + 1 : 0;
  const lastEnquiry = Math.min(requestedInboxPage * enquiryInboxPageSize, enquiries.total);
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
        <p className="admin-due-follow-ups-count">
          {due.total ? `Showing ${firstDueItem}–${lastDueItem} of ${due.total} due follow-ups` : "0 due follow-ups"}
        </p>
        {due.items.length ? (
          <ul>
            {due.items.map((enquiry) => (
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
        {followUpPageCount > 1 ? (
          <nav className="admin-follow-up-pagination" aria-label="Follow-up pages">
            {requestedFollowUpPage > 1 ? <Link rel="prev" href={href("follow-ups", requestedFollowUpPage - 1)}>Previous</Link> : <span />}
            <span>Page {requestedFollowUpPage} of {followUpPageCount}</span>
            {requestedFollowUpPage < followUpPageCount ? <Link rel="next" href={href("follow-ups", requestedFollowUpPage + 1)}>Next</Link> : <span />}
          </nav>
        ) : null}
      </section>
      <section className="admin-enquiry-list" id="latest-enquiries" aria-labelledby="latest-enquiries-heading">
        <h2 id="latest-enquiries-heading">All enquiries</h2>
        <p className="admin-due-follow-ups-count">
          {enquiries.total ? `Showing ${firstEnquiry}–${lastEnquiry} of ${enquiries.total} enquiries` : "0 enquiries"}
        </p>
      {enquiries.items.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption>Latest enquiries</caption>
            <thead><tr><th>Contact</th><th>Type</th><th>Property</th><th>Status</th><th>Follow-up</th><th>Received</th></tr></thead>
            <tbody>
              {enquiries.items.map((enquiry) => (
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
        {inboxPageCount > 1 ? (
          <nav className="admin-follow-up-pagination" aria-label="Enquiry pages">
            {requestedInboxPage > 1 ? <Link rel="prev" href={href("inbox", requestedInboxPage - 1)}>Previous</Link> : <span />}
            <span>Page {requestedInboxPage} of {inboxPageCount}</span>
            {requestedInboxPage < inboxPageCount ? <Link rel="next" href={href("inbox", requestedInboxPage + 1)}>Next</Link> : <span />}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
