export type AvailabilityStatus = "unconfirmed" | "available" | "on_hold";

const confirmationWindowMs = 14 * 24 * 60 * 60 * 1000;

export function effectiveAvailability(
  status: string, checkedAt: string | null | undefined, now = new Date(),
): { status: AvailabilityStatus; checkedAt?: string } {
  if ((status !== "available" && status !== "on_hold") || !checkedAt) return { status: "unconfirmed" };
  const checked = Date.parse(checkedAt);
  if (!Number.isFinite(checked) || checked < now.getTime() - confirmationWindowMs ||
    checked > now.getTime() + 5 * 60 * 1000) return { status: "unconfirmed" };
  return { status, checkedAt: new Date(checked).toISOString().slice(0, 10) };
}

export function availabilityLabel(status: AvailabilityStatus, checkedAt?: string) {
  if (status === "available" && checkedAt) return `Confirmed available · checked ${checkedAt}`;
  if (status === "on_hold" && checkedAt) return `On hold · checked ${checkedAt}`;
  return "Availability to confirm";
}
