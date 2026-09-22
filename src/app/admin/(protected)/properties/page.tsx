import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmpty } from "@/components/admin-empty";
import { AdminStatus } from "@/components/admin-status";
import { formatAdminDate, formatAdminMoney } from "@/lib/admin/format";
import { listAdminProperties } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Properties" };

export default async function AdminPropertiesPage() {
  const [properties, staff] = await Promise.all([
    listAdminProperties(),
    requireStaff(),
  ]);
  const canManage =
    staff.role === "administrator" || staff.role === "property_manager";

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="eyebrow">Inventory</p>
        <h1>Properties</h1>
        <p>Published, draft, reserved, sold, and archived inventory.</p>
        {canManage ? (
          <Link className="button button-primary" href="/admin/properties/new">
            Add property
          </Link>
        ) : null}
      </header>
      {properties.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption>Property inventory</caption>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Property</th>
                <th>Source</th>
                <th>Status</th>
                <th>Price</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>{property.reference}</td>
                  <td>
                    <strong>
                      <Link href={`/admin/properties/${property.id}/edit`}>
                        {property.title}
                      </Link>
                    </strong>
                    <span>{property.location_name}</span>
                  </td>
                  <td>{property.source.replaceAll("_", " ")}</td>
                  <td><AdminStatus value={property.status} /></td>
                  <td>{formatAdminMoney(property.price_amount, property.price_currency)}</td>
                  <td>{formatAdminDate(property.last_verified_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <AdminEmpty message="Add inventory after the audited mutation workflow is enabled." />
      )}
    </div>
  );
}
