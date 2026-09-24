import type { Metadata } from "next";
import Link from "next/link";
import { AdminExistingStaff } from "@/components/admin-existing-staff";
import { listAdminStaff } from "@/lib/admin/queries";
import { formatAdminDate } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Staff Management" };

export default async function StaffPage() {
  const staff = await listAdminStaff();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Operations / Access</p>
        <h1>Staff</h1>
        <p>Give each teammate the minimum role they need, and hand off assigned work before removing access.</p>
      </header>
      <AdminExistingStaff />
      <div className="admin-table-wrap"><table className="admin-table">
        <caption>Staff directory</caption>
        <thead><tr><th>Staff member</th><th>Role</th><th>Access</th><th>Added</th></tr></thead>
        <tbody>{staff.map((member) => (
          <tr key={member.user_id}>
            <td><strong><Link href={`/admin/staff/${member.user_id}`}>{member.display_name}</Link></strong><span>{member.email}</span></td>
            <td>{member.role.replaceAll("_", " ")}</td>
            <td>{!member.active ? "Disabled" : member.auth_eligible ? "Active" : "Auth blocked"}</td>
            <td>{formatAdminDate(member.created_at)}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}
