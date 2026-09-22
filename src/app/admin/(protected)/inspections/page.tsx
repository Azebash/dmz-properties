import type { Metadata } from "next";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate } from "@/lib/admin/format";
import { listAdminInspections } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Inspections" };

export default async function AdminInspectionsPage() {
  const inspections = await listAdminInspections();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Appointments</p>
        <h1>Inspections</h1>
        <p>Physical, representative, and live-video inspection requests.</p>
      </header>
      {inspections.length ? (
        <div className="admin-table-wrap"><table className="admin-table">
          <caption>Inspection requests</caption>
          <thead><tr><th>Type</th><th>Preferred date</th><th>Alternate</th><th>Time zone</th><th>Status</th></tr></thead>
          <tbody>{inspections.map((inspection) => <tr key={inspection.id}>
            <td>{inspection.inspection_type}</td>
            <td>{formatAdminDate(inspection.preferred_date)}</td>
            <td>{formatAdminDate(inspection.alternate_date)}</td>
            <td>{inspection.time_zone}</td>
            <td><AdminStatus value={inspection.status} /></td>
          </tr>)}</tbody>
        </table></div>
      ) : <AdminEmpty message="Requested inspections will appear here." />}
    </div>
  );
}
