const deployedHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (deployedHost ? `https://${deployedHost}` : "http://localhost:3000");

export const siteName = "DMZ Properties";
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
