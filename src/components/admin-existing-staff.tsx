"use client";

import { useActionState } from "react";
import { registerExistingStaffAction } from "@/app/admin/(protected)/staff/actions";

export function AdminExistingStaff() {
  const [state, action, pending] = useActionState(registerExistingStaffAction, { error: "", message: "" });
  return (
    <section className="admin-existing-staff">
      <form className="admin-editor" action={action}>
        <h2>Grant staff access</h2>
        <p>Use the UUID of an already-created Supabase Auth user. They still need their own sign-in credentials.</p>
        <div className="admin-form-grid">
          <div className="field">
            <label htmlFor="existing-staff-id">Auth user ID</label>
            <input id="existing-staff-id" name="userId" required />
          </div>
          <div className="field">
            <label htmlFor="existing-staff-name">Display name</label>
            <input id="existing-staff-name" name="displayName" minLength={2} maxLength={120} required />
          </div>
          <div className="field">
            <label htmlFor="existing-staff-role">Starting role</label>
            <select id="existing-staff-role" name="role" defaultValue="viewer">
              <option value="viewer">Read-only viewer</option>
              <option value="content_editor">Content editor</option>
              <option value="property_manager">Property manager</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
        </div>
        <button className="button button-secondary" type="submit" disabled={pending}>
          {pending ? "Granting..." : "Grant staff access"}
        </button>
        {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
      </form>
    </section>
  );
}
