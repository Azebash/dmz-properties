import { describe, expect, it } from "vitest";
import { serializeStructuredData } from "../src/lib/structured-data";

describe("structured data embedded in HTML", () => {
  it("cannot close a script tag through property or article copy", () => {
    const malicious = '</script><script data-test="breakout">alert(1)</script>';
    const serialized = serializeStructuredData({ title: malicious });
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script");
    expect(JSON.parse(serialized)).toEqual({ title: malicious });
  });
});
