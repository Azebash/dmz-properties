import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActivity } from "@/components/admin-activity";
import { AdminStaffAccess } from "@/components/admin-staff-access";
import { uuidPattern } from "@/lib/admin/lead-workflow";
import { getAdminActivity, listAdminStaff } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Staff Access" };

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const [staff, history] = await Promise.all([listAdminStaff(), getAdminActivity("staff_profile", id)]);
  const member = staff.find((entry) => entry.user_id === id);
  if (!member) notFound();
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow"><Link href="/admin/staff">Staff</Link> / {member.email}</p>
        <h1>{member.display_name}</h1>
        <p>Role and access changes are audited. Assigned work must be handed off before disabling a teammate.</p>
      </header>
      <AdminStaffAccess userId={member.user_id} displayName={member.display_name} role={member.role} active={member.active} />
      <AdminActivity events={history} entityType="staff_profile" />
    </div>
  );
}
