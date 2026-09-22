import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPropertyForm } from "@/components/admin-property-form";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "New Property" };

export default async function NewPropertyPage() {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    redirect("/admin/access-denied");
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Inventory / New</p>
        <h1>Create property</h1>
        <p>New records begin as drafts and cannot publish without verification.</p>
      </header>
      <AdminPropertyForm />
    </div>
  );
}
