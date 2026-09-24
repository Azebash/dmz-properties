import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { imageExtension, isVirginLandType, maxPropertyImageBytes, parseMediaDetails } from "../src/lib/admin/property-media-validation";
import { normalizePropertyImage } from "../src/lib/admin/normalize-property-image";

describe("private property image uploads", () => {
  it("rejects mislabeled and oversized files rather than trusting a filename", () => {
    expect(imageExtension("image/png", new Uint8Array(20))).toBeNull();
    expect(imageExtension("image/svg+xml", new Uint8Array(20))).toBeNull();
    expect(imageExtension("image/jpeg", new Uint8Array(maxPropertyImageBytes + 1))).toBeNull();
    expect(imageExtension("image/png", new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]))).toBe("png");
  });

  it("only permits estate-context classification for virgin land", () => {
    const form = new FormData();
    form.set("altText", "Street within KYC Homes Phase II");
    form.set("caption", "Completed homes along an estate road");
    form.set("classification", "property_photo");
    expect(parseMediaDetails(form, "Land")).toMatchObject({ success: false });
    expect(parseMediaDetails(form, "Virgin Land")).toMatchObject({ success: false });
    expect(parseMediaDetails(form, "residential plot")).toMatchObject({ success: false });
    expect(isVirginLandType("landed home")).toBe(false);
    form.set("classification", "estate_context");
    expect(parseMediaDetails(form, "Land")).toMatchObject({ success: true, estateContext: true });
    form.set("classification", "property_photo");
    expect(parseMediaDetails(form, "House")).toMatchObject({ success: true, estateContext: false });
  });

  it("fully decodes a real estate photo and rejects a fake header", async () => {
    const source = await readFile("public/images/estate/estate-street.webp");
    const image = await normalizePropertyImage("image/webp", source);
    expect(image).not.toBeNull();
    expect(image?.subarray(0, 4).toString()).toBe("RIFF");
    expect(image?.subarray(8, 12).toString()).toBe("WEBP");
    const fake = Buffer.from([0xff, 0xd8, 0xff, ...new Array(24).fill(0)]);
    expect(await normalizePropertyImage("image/jpeg", fake)).toBeNull();
    const tagged = await sharp(source).withMetadata({ exif: { IFD0: { Copyright: "Private fixture" } } })
      .webp().toBuffer();
    expect((await sharp(tagged).metadata()).exif).toBeDefined();
    const cleaned = await normalizePropertyImage("image/webp", tagged);
    expect((await sharp(cleaned!).metadata()).exif).toBeUndefined();
  });
});
