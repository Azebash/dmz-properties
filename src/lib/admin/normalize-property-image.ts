import "server-only";

import sharp from "sharp";
import { imageExtension, maxPropertyImageBytes } from "@/lib/admin/property-media-validation";

export async function normalizePropertyImage(type: string, bytes: Uint8Array) {
  if (!imageExtension(type, bytes)) return null;
  try {
    // Decoding validates the full file; re-encoding removes EXIF and normalizes delivery.
    const image = await sharp(bytes, { failOn: "error", limitInputPixels: 25_000_000 })
      .rotate()
      .resize({ width: 2400, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return image.length <= maxPropertyImageBytes ? image : null;
  } catch {
    return null;
  }
}
