import { describe, expect, it } from "vitest";
import { areaGuideCopyFromForm, areaGuideFields, parseAreaGuideCopy, parseDeveloperPrice, repositoryAreaGuideCopy } from "../src/lib/area-guide-copy";

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
    form.set("developerPriceAmount", "14000000");
    form.set("developerPlotSize", "600");
    form.set("developerPriceDate", "2026-09-17");
    form.set("developerPriceVisible", "on");
    expect(areaGuideCopyFromForm(form)).toEqual(repositoryAreaGuideCopy);
  });

  it("does not invent prices for older approved guides", () => {
    expect(parseAreaGuideCopy({ ...repositoryAreaGuideCopy, developerPrice: undefined }).developerPrice).toBeNull();
  });

  it("rejects invalid amounts, sizes, dates, and visibility at the editor boundary", () => {
    const valid = repositoryAreaGuideCopy.developerPrice!;
    for (const invalid of [
      { amount: 0 }, { amount: Infinity }, { plotSizeSqm: -1 },
      { confirmedAt: "2026-02-30" }, { confirmedAt: "2099-01-01" }, { visible: "true" },
    ]) expect(() => parseDeveloperPrice({ ...valid, ...invalid })).toThrow();
  });
});
