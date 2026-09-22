import type { Json } from "@/lib/supabase/database.types";

export type PropertyPayloadResult =
  | { success: true; payload: Json }
  | { success: false; error: string };

function value(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

export function propertyPayloadFromFormData(
  formData: FormData,
): PropertyPayloadResult {
  const required = [
    "reference",
    "slug",
    "title",
    "source",
    "propertyType",
    "locationName",
    "description",
  ];
  if (required.some((name) => !value(formData, name))) {
    return { success: false, error: "Complete every required property field." };
  }

  const slug = value(formData, "slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { success: false, error: "Use lowercase words separated by hyphens for the slug." };
  }

  const source = value(formData, "source");
  if (!['developer_inventory', 'owner_resale'].includes(source)) {
    return { success: false, error: "Select a valid property source." };
  }

  for (const numericField of ["priceAmount", "plotSizeSqm", "latitude", "longitude"]) {
    const input = value(formData, numericField);
    if (input && (!Number.isFinite(Number(input)) || Number(input) < 0)) {
      return { success: false, error: `${numericField} must be a valid positive number.` };
    }
  }

  const features = value(formData, "features")
    .split(/\r?\n/)
    .map((feature) => feature.trim())
    .filter(Boolean);

  return {
    success: true,
    payload: {
      id: value(formData, "id"),
      reference: value(formData, "reference").toUpperCase(),
      slug,
      title: value(formData, "title"),
      source,
      propertyType: value(formData, "propertyType"),
      locationName: value(formData, "locationName"),
      address: value(formData, "address"),
      latitude: value(formData, "latitude"),
      longitude: value(formData, "longitude"),
      priceAmount: value(formData, "priceAmount"),
      priceCurrency: value(formData, "priceCurrency") || "NGN",
      priceLabel: value(formData, "priceLabel"),
      plotSizeSqm: value(formData, "plotSizeSqm"),
      ownershipLabel: value(formData, "ownershipLabel"),
      description: value(formData, "description"),
      features,
      seoTitle: value(formData, "seoTitle"),
      seoDescription: value(formData, "seoDescription"),
      lastVerifiedAt: value(formData, "lastVerifiedAt"),
    },
  };
}
