import type { Database } from "@/lib/supabase/database.types";
import { formatAdminDateTime } from "@/lib/admin/format";
import { articleActivityDetail } from "@/lib/admin/article-activity";

type Activity = Pick<
  Database["public"]["Tables"]["audit_events"]["Row"],
  "id" | "action" | "created_at" | "actor_id" | "previous_value" | "next_value"
> & { actor: { display_name: string } | null };

export function AdminActivity({
  events,
  entityType,
}: {
  events: Activity[];
  entityType?: "article";
}) {
  if (!events.length) return null;

  return (
    <section className="admin-activity" aria-label="Audit history">
      <h2>Activity</h2>
      <ol>
        {events.map((event) => {
          const nextStatus = event.next_value &&
            typeof event.next_value === "object" &&
            !Array.isArray(event.next_value) &&
            typeof event.next_value.status === "string"
            ? `Stage: ${event.next_value.status.replaceAll("_", " ")}`
            : null;
          const detail = entityType === "article"
            ? articleActivityDetail(event.action, event.previous_value, event.next_value)
            : nextStatus;
          return (
            <li key={event.id}>
              <div>
                <strong>{event.action.replaceAll("_", " ")}</strong>
                <time dateTime={event.created_at}>
                  {formatAdminDateTime(event.created_at)}
                </time>
              </div>
              <span>By {event.actor?.display_name || (event.actor_id ? "Former staff member" : "System")}</span>
              {detail ? <span>{detail}</span> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
