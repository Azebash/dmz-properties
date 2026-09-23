export function formatAdminDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export function formatAdminDateTime(value: string, timeZone = "Africa/Lagos") {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value));
  }
}

export function formatAdminMoney(value: number | null, currency = "NGN") {
  if (value === null) return "Not set";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
