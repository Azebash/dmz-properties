import { getAdminSummary } from "@/lib/admin/dashboard";
import { requireStaff } from "@/lib/admin/auth";

export default async function AdminDashboardPage() {
  const [staff, summary] = await Promise.all([requireStaff(), getAdminSummary()]);
  const metrics = [
    ["Properties", summary.properties],
    ["Enquiries", summary.enquiries],
    ["Inspection requests", summary.inspections],
    ["Seller reviews", summary.sellerSubmissions],
  ] as const;

  return (
    <div className="admin-dashboard">
      <header>
        <p className="eyebrow">Operations overview</p>
        <h1>Welcome, {staff.display_name}.</h1>
        <p>Read-only operational summary from the Supabase project.</p>
      </header>
      <section className="admin-metrics" aria-label="Operational totals">
        {metrics.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="admin-foundation-note">
        <h2>Foundation stage</h2>
        <p>
          Authentication, RLS, storage policies, and read-only dashboard queries
          are enabled. Editing workflows remain disabled until the live migration
          and database policy tests have passed.
        </p>
      </section>
    </div>
  );
}
