import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminActivity } from "@/components/admin-activity";
import { AdminAreaGuideForm } from "@/components/admin-area-guide-form";
import { AdminStatus } from "@/components/admin-status";
import { transitionAreaGuideAction } from "./actions";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminActivity, getAdminAreaGuide } from "@/lib/admin/queries";
import { areaGuideSlug, parseAreaGuideCopy } from "@/lib/area-guide-copy";

export const metadata: Metadata = { title: "Edit Area Guide" };

export default async function EditAreaGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; transition?: string }>;
}) {
  const [staff, guide, activity, query] = await Promise.all([
    requireStaff(), getAdminAreaGuide(areaGuideSlug),
    getAdminActivity("area_guide", areaGuideSlug), searchParams,
  ]);
  if (staff.role !== "administrator" && staff.role !== "content_editor") {
    redirect("/admin/access-denied");
  }
  if (!guide) notFound();
  const copy = parseAreaGuideCopy(guide.draft_copy);
  const transitions = guide.status === "draft" ? ["under_review"]
    : guide.status === "under_review" ? ["draft", "published"] : [];

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-edit-header">
        <div>
          <p className="eyebrow">Content / Area guides</p>
          <h1>KYC Homes Phase II</h1>
          <p><Link href="/areas/kyc-homes-phase-ii">View approved public page</Link></p>
        </div>
        <AdminStatus value={guide.status} />
      </header>
      {guide.status !== "published" ? (
        <p className="admin-readonly-note">The public page continues to show the last approved version while changes are reviewed.</p>
      ) : null}
      {query.saved === "1" ? <p className="admin-success" role="status">Draft saved for review.</p> : null}
      {query.transition === "saved" ? <p className="admin-success" role="status">Publication status updated.</p> : null}
      {query.transition === "failed" ? <p className="admin-auth-error" role="alert">This transition is not allowed.</p> : null}
      <AdminAreaGuideForm copy={copy} />
      {transitions.length ? (
        <section className="admin-transitions">
          <h2>Publication workflow</h2>
          <p>The live page changes only when reviewed copy is published.</p>
          <div>
            {transitions.map((status) => (
              <form key={status} action={transitionAreaGuideAction}>
                <input name="status" type="hidden" value={status} />
                <button type="submit" className="button button-secondary">
                  Move to {status.replaceAll("_", " ")}
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}
      <AdminActivity events={activity} />
    </div>
  );
}
