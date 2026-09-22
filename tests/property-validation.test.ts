import { describe, expect, it } from "vitest";
import { propertyPayloadFromFormData } from "../src/lib/admin/property-validation";

function validForm() {
  const form = new FormData();
  form.set("reference", "dmz-test-1");
  form.set("slug", "test-property");
  form.set("title", "Test Property");
  form.set("source", "developer_inventory");
  form.set("propertyType", "Land");
  form.set("locationName", "Abuja");
  form.set("description", "A valid test property description.");
  form.set("priceAmount", "14000000");
  form.set("features", "First feature\nSecond feature");
  return form;
}

describe("propertyPayloadFromFormData", () => {
  it("normalizes a valid editor submission", () => {
    const result = propertyPayloadFromFormData(validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload).toMatchObject({
        reference: "DMZ-TEST-1",
        slug: "test-property",
        priceAmount: "14000000",
        features: ["First feature", "Second feature"],
      });
    }
  });

  it("rejects invalid slugs", () => {
    const form = validForm();
    form.set("slug", "Invalid Slug");
    expect(propertyPayloadFromFormData(form).success).toBe(false);
  });

  it("rejects invalid numeric fields", () => {
    const form = validForm();
    form.set("priceAmount", "not-a-number");
    expect(propertyPayloadFromFormData(form).success).toBe(false);
  });
});
