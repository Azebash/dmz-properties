import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActivity } from "@/components/admin-activity";
import { AdminEnquiryWorkflow } from "@/components/admin-enquiry-workflow";
import { AdminLeadAssignment } from "@/components/admin-lead-assignment";
import { AdminEnquiryFollowUp } from "@/components/admin-enquiry-follow-up";
import { AdminStatus } from "@/components/admin-status";
import { requireStaff } from "@/lib/admin/auth";
import { formatAdminDateTime } from "@/lib/admin/format";
import { followUpLabel } from "@/lib/admin/follow-ups";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { getAdminActivity, getAdminEnquiry, listAdminStaff } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Enquiry Details" };

export default async function AdminEnquiryDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const [staff, enquiry, activity] = await Promise.all([
    requireStaff(),
    getAdminEnquiry(id),
    getAdminActivity("enquiry", id),
  ]);
  if (!enquiry) notFound();
  const canManage = staff.role === "administrator" || staff.role === "property_manager";
  const assignees = staff.role === "administrator"
    ? (await listAdminStaff()).filter((member) => member.active && member.auth_eligible &&
      (member.role === "administrator" || member.role === "property_manager"))
    : [];

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-edit-header">
        <div>
          <p className="eyebrow"><Link href="/admin/enquiries">Enquiries</Link> / Lead detail</p>
          <h1>{enquiry.name}</h1>
          <p>Received {formatAdminDateTime(enquiry.created_at)}</p>
        </div>
        <AdminStatus value={enquiry.status} />
      </header>

      <div className="admin-detail-layout">
        <div>
          <section className="admin-detail-card">
            <h2>Buyer enquiry</h2>
            <dl className="admin-detail-list">
              <div><dt>Type</dt><dd>{enquiry.enquiry_type}</dd></div>
              <div><dt>Property</dt><dd>{enquiry.property_reference || "General enquiry"}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a></dd></div>
              <div><dt>Location</dt><dd>{enquiry.current_location || "Not provided"}</dd></div>
              <div><dt>Budget</dt><dd>{enquiry.budget || "Not provided"}</dd></div>
              <div><dt>Timeline</dt><dd>{enquiry.purchase_timeline || "Not provided"}</dd></div>
              <div><dt>Owner</dt><dd>{staff.role === "administrator"
                ? assignees.find((member) => member.user_id === enquiry.assigned_to)?.display_name || "Unassigned"
                : !enquiry.assigned_to ? "Unassigned"
                   : enquiry.assigned_to === staff.user_id ? "Assigned to you" : "Team assignment"}</dd></div>
              <div><dt>Next follow-up</dt><dd>{followUpLabel(enquiry.follow_up_on)}</dd></div>
              <div><dt>Preferred contact</dt><dd>{enquiry.preferred_contact_method || "Not provided"}</dd></div>
              <div><dt>Contact time</dt><dd>{enquiry.preferred_contact_time || "Not provided"}</dd></div>
            </dl>
            <h3>Buyer message</h3>
            <p className="admin-message">{enquiry.message}</p>
            {enquiry.internal_notes ? (
              <><h3>Private follow-up</h3><p className="admin-message">{enquiry.internal_notes}</p></>
            ) : null}
          </section>
          <section className="admin-detail-card">
            <h2>Source and consent</h2>
            <dl className="admin-detail-list">
              <div><dt>Privacy consent</dt><dd>{formatAdminDateTime(enquiry.privacy_consent_at)}</dd></div>
              <div><dt>Attribution</dt><dd>{JSON.stringify(enquiry.attribution)}</dd></div>
            </dl>
          </section>
          <AdminActivity events={activity} />
        </div>
        {canManage ? (
          <div className="admin-workflow-group">
            {staff.role === "administrator" ? (
              <AdminLeadAssignment enquiryId={enquiry.id} assignedTo={enquiry.assigned_to} staff={assignees} />
            ) : null}
            <AdminEnquiryFollowUp id={enquiry.id} status={enquiry.status} followUpOn={enquiry.follow_up_on} />
            <AdminEnquiryWorkflow id={enquiry.id} status={enquiry.status} notes={enquiry.internal_notes} />
          </div>
        ) : (
          <p className="admin-readonly-note">Your staff role can view but not change lead records.</p>
        )}
      </div>
    </div>
  );
}
