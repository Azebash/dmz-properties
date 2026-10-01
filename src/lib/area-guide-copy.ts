export const areaGuideSlug = "kyc-homes-phase-ii";

export const areaGuideFields = [
  { key: "heroTitle", label: "Opening headline" },
  { key: "heroDescription", label: "Opening description" },
  { key: "galleryTitle", label: "Gallery headline" },
  { key: "galleryDescription", label: "Gallery description" },
  { key: "pathsTitle", label: "Buying routes headline" },
  { key: "infrastructureTitle", label: "Development standards headline" },
  { key: "processTitle", label: "How we help headline" },
  { key: "seoTitle", label: "Search title" },
  { key: "seoDescription", label: "Search description" },
] as const;

export type DeveloperPrice = {
  amount: number;
  plotSizeSqm: number;
  confirmedAt: string;
  visible: boolean;
};
export type AreaGuideCopy = Record<(typeof areaGuideFields)[number]["key"], string> & {
  developerPrice: DeveloperPrice | null;
};

export const repositoryAreaGuideCopy: AreaGuideCopy = {
  heroTitle: "KYC Homes Phase II, understood from within.",
  heroDescription: "Explore land and properties in an established Abuja estate where hundreds have already developed and new development continues.",
  galleryTitle: "Established homes. Active development.",
  galleryDescription: "Genuine photography from KYC Homes Phase II showing completed residences alongside continuing construction across the estate.",
  pathsTitle: "Two ways to own within the estate.",
  infrastructureTitle: "Coordinated development standards.",
  processTitle: "Guidance from your first enquiry to purchase.",
  seoTitle: "Land and Properties in KYC Homes Phase II, Abuja",
  seoDescription: "Explore developer land, developed homes, and verified owner resales in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja.",
  developerPrice: { amount: 14_000_000, plotSizeSqm: 600, confirmedAt: "2026-09-17", visible: true },
};

export function parseDeveloperPrice(value: unknown): DeveloperPrice | null {
  // Older approved guides remain readable during the migration; no price is invented.
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid developer price");
  const price = value as Record<string, unknown>;
  if (typeof price.amount !== "number" || !Number.isFinite(price.amount) || price.amount <= 0 || price.amount > 1e12 ||
      typeof price.plotSizeSqm !== "number" || !Number.isFinite(price.plotSizeSqm) || price.plotSizeSqm <= 0 || price.plotSizeSqm > 1e7 ||
      typeof price.confirmedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(price.confirmedAt) ||
      !Number.isFinite(Date.parse(price.confirmedAt)) || new Date(price.confirmedAt).toISOString().slice(0, 10) !== price.confirmedAt ||
      price.confirmedAt > new Date().toISOString().slice(0, 10) || typeof price.visible !== "boolean") {
    throw new Error("Enter a valid developer price, plot size, and past or current confirmation date");
  }
  return { amount: price.amount, plotSizeSqm: price.plotSizeSqm, confirmedAt: price.confirmedAt, visible: price.visible };
}

export function parseAreaGuideCopy(value: unknown): AreaGuideCopy {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Area guide copy is unavailable");
  }
  const fields = value as Record<string, unknown>;
  const copy = {} as AreaGuideCopy;
  for (const { key } of areaGuideFields) {
    const text = fields[key];
    if (typeof text !== "string" || text.trim().length < 10 || text.trim().length > 400) {
      throw new Error(`Area guide copy is incomplete: ${key}`);
    }
    copy[key] = text.trim();
  }
  copy.developerPrice = parseDeveloperPrice(fields.developerPrice);
  return copy;
}

export function areaGuideCopyFromForm(formData: FormData) {
  const amount = String(formData.get("developerPriceAmount") || "").trim();
  const size = String(formData.get("developerPlotSize") || "").trim();
  const date = String(formData.get("developerPriceDate") || "").trim();
  const visible = formData.get("developerPriceVisible") === "on";
  return parseAreaGuideCopy({
    ...Object.fromEntries(areaGuideFields.map(({ key }) => [key, formData.get(key)])),
    developerPrice: !amount && !size && !date && !visible ? null : {
      amount: Number(amount), plotSizeSqm: Number(size), confirmedAt: date, visible,
    },
  });
}
