import { formatAdminDate } from "@/lib/admin/format";

export const followUpStatuses = ["new", "qualified", "inspection", "offer"] as const;
export const dueFollowUpPageSize = 50;
export const enquiryInboxPageSize = 50;

export function parseFollowUpPage(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^\d{1,5}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function followUpRange(page: number) {
  const first = (page - 1) * dueFollowUpPageSize;
  return { from: first, to: first + dueFollowUpPageSize - 1 };
}

export function parseEnquiryPage(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^\d{1,5}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function enquiryInboxRange(page: number) {
  return enquiryPageRange(page);
}

export function enquiryPageRange(page: number) {
  const first = (page - 1) * enquiryInboxPageSize;
  return { from: first, to: first + enquiryInboxPageSize - 1 };
}

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
