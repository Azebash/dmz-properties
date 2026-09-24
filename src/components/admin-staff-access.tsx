"use client";

import { useActionState } from "react";
import { updateStaffAction } from "@/app/admin/(protected)/staff/actions";
import type { Database } from "@/lib/supabase/database.types";

type StaffRole = Database["public"]["Enums"]["staff_role"];

export function AdminStaffAccess({
  userId, displayName, role, active,
}: {
  userId: string;
  displayName: string;
  role: StaffRole;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(updateStaffAction, { error: "", message: "" });
  return (
    <form className="admin-editor" action={action}>
      <h2>Access and role</h2>
      <input type="hidden" name="userId" value={userId} />
      <div className="admin-form-grid">
        <div className="field">
          <label htmlFor="access-name">Display name</label>
          <input id="access-name" name="displayName" defaultValue={displayName} minLength={2} maxLength={120} required />
        </div>
        <div className="field">
          <label htmlFor="access-role">Role</label>
          <select id="access-role" name="role" defaultValue={role}>
            <option value="viewer">Read-only viewer</option>
            <option value="content_editor">Content editor</option>
            <option value="property_manager">Property manager</option>
            <option value="administrator">Administrator</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="access-active">Access</label>
          <select id="access-active" name="active" defaultValue={String(active)}>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>
      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Saving..." : "Save access"}
      </button>
      {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
      {state.message ? <p className="admin-success" role="status">{state.message}</p> : null}
    </form>
  );
}
