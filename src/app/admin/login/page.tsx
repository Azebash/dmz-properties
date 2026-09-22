import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin-login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string; setup?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="admin-surface admin-auth-page">
      <section className="admin-auth-card">
        <p className="eyebrow">DMZ Operations</p>
        <h1>Staff sign in</h1>
        {configured ? (
          <AdminLoginForm nextPath={params.next} />
        ) : (
          <div className="admin-setup-message">
            <h2>Supabase setup required</h2>
            <p>
              Configure `NEXT_PUBLIC_SUPABASE_URL` and
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then apply the migration and
              create the first administrator profile.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
