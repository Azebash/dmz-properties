import { describe, expect, it } from "vitest";
import { followUpLabel, lagosToday } from "@/lib/admin/follow-ups";

describe("Abuja follow-up dates", () => {
  it("uses the business date at the UTC day boundary", () => {
    expect(lagosToday(new Date("2026-09-25T22:30:00Z"))).toBe("2026-09-25");
    expect(lagosToday(new Date("2026-09-25T23:30:00Z"))).toBe("2026-09-26");
  });

  it("distinguishes overdue, due today, upcoming and unscheduled reminders", () => {
    expect(followUpLabel("2026-09-24", "2026-09-25")).toMatch(/^Overdue/);
    expect(followUpLabel("2026-09-25", "2026-09-25")).toMatch(/^Due today/);
    expect(followUpLabel("2026-09-26", "2026-09-25")).toMatch(/^Upcoming/);
    expect(followUpLabel(null, "2026-09-25")).toBe("Not scheduled");
  });
});
