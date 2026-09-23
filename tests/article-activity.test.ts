import { describe, expect, it } from "vitest";
import { articleActivityDetail } from "../src/lib/admin/article-activity";

describe("article audit summary", () => {
  it("shows publication transitions without printing raw audit data", () => {
    expect(articleActivityDetail(
      "status_changed",
      { status: "under_review" },
      { status: "published" },
    )).toBe("Stage: under review → published");
  });

  it("identifies changed editorial fields but ignores operational timestamps", () => {
    expect(articleActivityDetail(
      "updated",
      { title: "Original", body: [{ heading: "Intro", body: "Original copy" }], updated_at: "2026-09-01" },
      { title: "Revised", body: [{ heading: "Intro", body: "Revised copy" }], updated_at: "2026-09-02" },
    )).toBe("Changed: Title, Article sections");
  });

  it("does not invent a change summary for a creation event", () => {
    expect(articleActivityDetail("created", null, { title: "New article" })).toBeNull();
  });
});
