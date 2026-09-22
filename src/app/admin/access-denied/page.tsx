import type { Metadata } from "next";
import { signOut } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Admin Access Denied",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="admin-surface admin-auth-page">
      <section className="admin-auth-card">
        <p className="eyebrow">Access denied</p>
        <h1>No active staff profile</h1>
        <p>
          Your Supabase identity is valid, but it is not linked to an active DMZ
          staff role. Ask an administrator to create or reactivate your profile.
        </p>
        <form action={signOut}>
          <button className="button button-secondary" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
