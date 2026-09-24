export const maxPropertyImageBytes = 3_000_000;

export function isVirginLandType(propertyType: string) {
  return /(^|[^a-z0-9])(land|plots?)([^a-z0-9]|$)/i.test(propertyType);
}

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export function imageExtension(type: string, bytes: Uint8Array) {
  if (!Object.hasOwn(imageTypes, type) || bytes.length < 12 || bytes.length > maxPropertyImageBytes) {
    return null;
  }
  if (type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return imageTypes["image/jpeg"];
  }
  if (type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10]
    .every((part, index) => bytes[index] === part)) return imageTypes["image/png"];
  if (type === "image/webp" && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP") return imageTypes["image/webp"];
  return null;
}

export function parseMediaDetails(formData: FormData, propertyType: string) {
  const alt = String(formData.get("altText") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const classification = String(formData.get("classification") || "");
  if (alt.length < 12 || alt.length > 220 || caption.length > 300 ||
    !["estate_context", "property_photo"].includes(classification)) {
    return { success: false as const, error: "Describe the image and choose its correct classification." };
  }
  if (isVirginLandType(propertyType) && classification !== "estate_context") {
    return { success: false as const, error: "Virgin-land photos can only show estate context." };
  }
  return { success: true as const, alt, caption, estateContext: classification === "estate_context" };
}
