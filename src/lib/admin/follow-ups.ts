import { formatAdminDate } from "@/lib/admin/format";

export const followUpStatuses = ["new", "qualified", "inspection", "offer"] as const;

export function lagosToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function followUpLabel(date: string | null, today = lagosToday()) {
  if (!date) return "Not scheduled";
  const formatted = formatAdminDate(`${date}T12:00:00Z`);
  if (date < today) return `Overdue · ${formatted}`;
  if (date === today) return `Due today · ${formatted}`;
  return `Upcoming · ${formatted}`;
}
