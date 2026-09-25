import { getAdminSummary } from "@/lib/admin/dashboard";
import { requireStaff } from "@/lib/admin/auth";

export default async function AdminDashboardPage() {
  const [staff, summary] = await Promise.all([requireStaff(), getAdminSummary()]);
  const metrics = [
    ["Properties", summary.properties],
    ...(summary.enquiries === null ? [] : [
      ["Enquiries", summary.enquiries],
      ["Inspection requests", summary.inspections],
      ["Seller reviews", summary.sellerSubmissions],
      ["Follow-ups due", summary.dueFollowUps],
    ]),
  ];

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
        <h2>Operations</h2>
        <p>{summary.enquiries === null
          ? "Property and editorial records remain available for read-only review. Private buyer and seller records require a property role."
          : "Manage property drafts and publication, qualify enquiries, and follow up on inspections. Each change is checked against staff permissions and recorded in the audit history."}</p>
      </section>
    </div>
  );
}
