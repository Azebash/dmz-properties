import { describe, expect, it } from "vitest";
import { articlePayloadFromFormData } from "../src/lib/admin/article-validation";

function validForm() {
  const data = new FormData();
  data.set("slug", "sabon-lugbe-land-guide");
  data.set("title", "A guide to land in Sabon Lugbe");
  data.set("category", "Buying guide");
  data.set("excerpt", "A practical look at land buying in Sabon Lugbe, Abuja.");
  data.set("readTimeMinutes", "3");
  data.set("sectionHeading1", "Know the location");
  data.set("sectionBody1", "Inspect the exact property and confirm access before making a decision.");
  data.set("sectionHeading2", "Check the paperwork");
  data.set("sectionBody2", "Have an independent professional review title and seller authority.");
  return data;
}

describe("articlePayloadFromFormData", () => {
  it("builds structured sections from a valid editorial form", () => {
    const result = articlePayloadFromFormData(validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload).toMatchObject({
        slug: "sabon-lugbe-land-guide",
        readTimeMinutes: 3,
        sections: [
          { heading: "Know the location", body: expect.any(String) },
          { heading: "Check the paperwork", body: expect.any(String) },
        ],
      });
    }
  });

  it("rejects incomplete sections and unsafe URL slugs", () => {
    const missingBody = validForm();
    missingBody.set("sectionBody2", "");
    expect(articlePayloadFromFormData(missingBody).success).toBe(false);
    const badSlug = validForm();
    badSlug.set("slug", "../../developer-portal");
    expect(articlePayloadFromFormData(badSlug).success).toBe(false);
  });
});
