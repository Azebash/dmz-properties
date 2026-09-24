import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActivity } from "@/components/admin-activity";
import { AdminInspectionWorkflow } from "@/components/admin-inspection-workflow";
import { AdminLeadAssignment } from "@/components/admin-lead-assignment";
import { AdminStatus } from "@/components/admin-status";
import { requireStaff } from "@/lib/admin/auth";
import { formatAdminDate, formatAdminDateTime } from "@/lib/admin/format";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import {
  getAdminActivity,
  getAdminEnquiry,
  getAdminInspection,
  listAdminStaff,
} from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Inspection Details" };

export default async function AdminInspectionDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const [staff, inspection, activity] = await Promise.all([
    requireStaff(),
    getAdminInspection(id),
    getAdminActivity("inspection", id),
  ]);
  if (!inspection) notFound();

  const enquiry = await getAdminEnquiry(inspection.enquiry_id);
  const canManage = staff.role === "administrator" || staff.role === "property_manager";
  const assignees = staff.role === "administrator"
    ? (await listAdminStaff()).filter((member) => member.active && member.auth_eligible &&
      (member.role === "administrator" || member.role === "property_manager"))
    : [];

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-edit-header">
        <div>
          <p className="eyebrow"><Link href="/admin/inspections">Inspections</Link> / Request detail</p>
          <h1>{inspection.inspection_type}</h1>
          <p>Requested {formatAdminDateTime(inspection.created_at)}</p>
        </div>
        <AdminStatus value={inspection.status} />
      </header>

      <div className="admin-detail-layout">
        <div>
          <section className="admin-detail-card">
            <h2>Visit details</h2>
            <dl className="admin-detail-list">
              <div><dt>Buyer</dt><dd>{enquiry ? <Link href={`/admin/enquiries/${enquiry.id}`}>{enquiry.name}</Link> : "Enquiry unavailable"}</dd></div>
              <div><dt>Property</dt><dd>{enquiry?.property_reference || "General estate inspection"}</dd></div>
              <div><dt>Preferred date</dt><dd>{formatAdminDate(inspection.preferred_date)}</dd></div>
              <div><dt>Alternate date</dt><dd>{formatAdminDate(inspection.alternate_date)}</dd></div>
              <div><dt>Time zone</dt><dd>{inspection.time_zone}</dd></div>
              <div><dt>Owner</dt><dd>{staff.role === "administrator"
                ? assignees.find((member) => member.user_id === inspection.assigned_to)?.display_name || "Unassigned"
                : !inspection.assigned_to ? "Unassigned"
                  : inspection.assigned_to === staff.user_id ? "Assigned to you" : "Team assignment"}</dd></div>
              <div><dt>Confirmed time</dt><dd>{inspection.scheduled_at ? formatAdminDateTime(inspection.scheduled_at, inspection.time_zone) : "Not confirmed"}</dd></div>
              <div><dt>Email</dt><dd>{enquiry ? <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a> : "Not available"}</dd></div>
              <div><dt>Phone</dt><dd>{enquiry ? <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a> : "Not available"}</dd></div>
            </dl>
            {enquiry?.message ? <><h3>Buyer request</h3><p className="admin-message">{enquiry.message}</p></> : null}
            {inspection.outcome_notes ? <><h3>Inspection outcome</h3><p className="admin-message">{inspection.outcome_notes}</p></> : null}
          </section>
          <AdminActivity events={activity} />
        </div>
        {canManage ? (
          <div className="admin-workflow-group">
            {staff.role === "administrator" && enquiry ? (
              <AdminLeadAssignment enquiryId={enquiry.id} assignedTo={enquiry.assigned_to} staff={assignees} />
            ) : null}
            <AdminInspectionWorkflow id={inspection.id} status={inspection.status} timeZone={inspection.time_zone} />
          </div>
        ) : (
          <p className="admin-readonly-note">Your staff role can view but not change inspection records.</p>
        )}
      </div>
    </div>
  );
}
