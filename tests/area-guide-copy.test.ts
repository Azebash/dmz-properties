import { describe, expect, it } from "vitest";
import { areaGuideCopyFromForm, areaGuideFields, parseAreaGuideCopy, repositoryAreaGuideCopy } from "../src/lib/area-guide-copy";

describe("area guide copy", () => {
  it("keeps every published field present and valid for the repository rollback", () => {
    expect(parseAreaGuideCopy(repositoryAreaGuideCopy)).toEqual(repositoryAreaGuideCopy);
    expect(areaGuideFields).toHaveLength(9);
  });

  it("rejects missing and short public copy instead of silently using stale text", () => {
    expect(() => parseAreaGuideCopy({ ...repositoryAreaGuideCopy, heroTitle: "Short" })).toThrow();
    expect(() => parseAreaGuideCopy({ ...repositoryAreaGuideCopy, seoDescription: null })).toThrow();
  });

  it("accepts all editor fields while preserving exact page keys", () => {
    const form = new FormData();
    for (const { key } of areaGuideFields) form.set(key, repositoryAreaGuideCopy[key]);
    expect(areaGuideCopyFromForm(form)).toEqual(repositoryAreaGuideCopy);
  });
});
