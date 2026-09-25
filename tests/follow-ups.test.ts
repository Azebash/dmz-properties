import { describe, expect, it } from "vitest";
import {
  dueFollowUpPageSize, enquiryInboxPageSize, enquiryPageRange, followUpLabel,
  followUpRange, lagosToday, parseEnquiryPage, parseFollowUpPage,
} from "@/lib/admin/follow-ups";

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

  it("parses safe one-based pages and calculates non-overlapping result ranges", () => {
    expect(dueFollowUpPageSize).toBe(50);
    expect(parseFollowUpPage("1")).toBe(1);
    expect(parseFollowUpPage("2")).toBe(2);
    expect(parseFollowUpPage("0")).toBe(1);
    expect(parseFollowUpPage("-1")).toBe(1);
    expect(parseFollowUpPage("1.5")).toBe(1);
    expect(parseFollowUpPage("999999")).toBe(1);
    expect(parseFollowUpPage(["2", "3"])).toBe(1);
    expect(parseEnquiryPage("2")).toBe(2);
    expect(parseEnquiryPage("0")).toBe(1);
    expect(parseEnquiryPage(["2", "3"])).toBe(1);
    expect(followUpRange(1)).toEqual({ from: 0, to: 49 });
    expect(followUpRange(2)).toEqual({ from: 50, to: 99 });
    expect(enquiryInboxPageSize).toBe(50);
    expect(enquiryPageRange(1)).toEqual({ from: 0, to: 49 });
    expect(enquiryPageRange(2)).toEqual({ from: 50, to: 99 });
  });
});
