import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireStaff } from "@/lib/admin/auth";
import { signOut } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | DMZ Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();

  return (
    <main className="admin-surface admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          DMZ Operations
        </Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/properties">Properties</Link>
          <Link href="/admin/enquiries">Enquiries</Link>
          <Link href="/admin/inspections">Inspections</Link>
          <Link href="/admin/sellers">Seller reviews</Link>
          <Link href="/admin/content">Content</Link>
        </nav>
        <div className="admin-identity">
          <strong>{staff.display_name}</strong>
          <span>{staff.role.replaceAll("_", " ")}</span>
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </main>
  );
}
