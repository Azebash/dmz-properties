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

export type AreaGuideCopy = Record<(typeof areaGuideFields)[number]["key"], string>;

export const repositoryAreaGuideCopy: AreaGuideCopy = {
  heroTitle: "KYC Homes Phase II, understood from within.",
  heroDescription: "Explore land and properties in an established Abuja estate where hundreds have already developed and new development continues.",
  galleryTitle: "Established homes. Active development.",
  galleryDescription: "Genuine photography from KYC Homes Phase II showing completed residences alongside continuing construction across the estate.",
  pathsTitle: "Two ways to own within the estate.",
  infrastructureTitle: "Coordinated development standards.",
  processTitle: "Local knowledge without informal shortcuts.",
  seoTitle: "Land and Properties in KYC Homes Phase II, Abuja",
  seoDescription: "Explore developer land, developed homes, and verified owner resales in KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja.",
};

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
  return copy;
}

export function areaGuideCopyFromForm(formData: FormData) {
  return parseAreaGuideCopy(Object.fromEntries(areaGuideFields.map(({ key }) => [key, formData.get(key)])));
}
