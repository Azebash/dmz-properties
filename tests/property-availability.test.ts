import { describe, expect, it } from "vitest";
import { availabilityLabel, effectiveAvailability } from "@/lib/property-availability";

const now = new Date("2026-09-25T12:00:00Z");

describe("public availability truth", () => {
  it("does not infer stock from publication or a missing timestamp", () => {
    expect(effectiveAvailability("unconfirmed", null, now)).toEqual({ status: "unconfirmed" });
    expect(effectiveAvailability("available", null, now)).toEqual({ status: "unconfirmed" });
    expect(availabilityLabel("unconfirmed")).toBe("Availability to confirm");
  });

  it("expires inventory checks after 14 days without changing the stored audit record", () => {
    expect(effectiveAvailability("available", "2026-09-11T12:00:00Z", now)).toEqual({
      status: "available", checkedAt: "2026-09-11",
    });
    expect(effectiveAvailability("available", "2026-09-11T11:59:59Z", now))
      .toEqual({ status: "unconfirmed" });
    expect(effectiveAvailability("on_hold", "2026-09-24T10:00:00Z", now)).toEqual({
      status: "on_hold", checkedAt: "2026-09-24",
    });
    expect(effectiveAvailability("available", "2026-09-26T12:00:00Z", now))
      .toEqual({ status: "unconfirmed" });
  });
});
