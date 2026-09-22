"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeAdminDestination } from "@/lib/admin/navigation";

export function AdminLoginForm({ nextPath = "/admin" }: { nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") || "").trim();
    const password = String(values.get("password") || "");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("The email or password was not accepted.");
      setSubmitting(false);
      return;
    }

    router.replace(safeAdminDestination(nextPath));
    router.refresh();
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="admin-email">Staff email</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button className="button button-primary" type="submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>
      {error ? <p className="admin-auth-error" role="alert">{error}</p> : null}
    </form>
  );
}
