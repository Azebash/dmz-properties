import { describe, expect, it } from "vitest";
import { safeAdminDestination } from "../src/lib/admin/navigation";

describe("safeAdminDestination", () => {
  it("allows normalized admin paths", () => {
    expect(safeAdminDestination("/admin")).toBe("/admin");
    expect(safeAdminDestination("/admin/properties?status=draft")).toBe(
      "/admin/properties?status=draft",
    );
  });

  it("rejects lookalike, external, and malformed destinations", () => {
    expect(safeAdminDestination("/administrator")).toBe("/admin");
    expect(safeAdminDestination("https://attacker.example/admin")).toBe("/admin");
    expect(safeAdminDestination("/%2e%2e/admin")).toBe("/admin");
  });
});
