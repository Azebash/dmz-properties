import type { Database } from "@/lib/supabase/database.types";
import { formatAdminDateTime } from "@/lib/admin/format";

type Activity = Pick<
  Database["public"]["Tables"]["audit_events"]["Row"],
  "id" | "action" | "created_at" | "next_value"
>;

export function AdminActivity({ events }: { events: Activity[] }) {
  if (!events.length) return null;

  return (
    <section className="admin-activity" aria-label="Audit history">
      <h2>Activity</h2>
      <ol>
        {events.map((event) => (
          <li key={event.id}>
            <div>
              <strong>{event.action.replaceAll("_", " ")}</strong>
              <time dateTime={event.created_at}>
                {formatAdminDateTime(event.created_at)}
              </time>
            </div>
            {event.next_value &&
            typeof event.next_value === "object" &&
            !Array.isArray(event.next_value) &&
            typeof event.next_value.status === "string" ? (
              <span>Stage: {event.next_value.status.replaceAll("_", " ")}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
