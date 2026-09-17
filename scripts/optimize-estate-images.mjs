import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.resolve("public/images/kyc_homes_phase_2");
const outputDirectory = path.resolve("public/images/estate");

const selections = {
  "estate-hero.webp": "IMG_0693.JPG",
  "estate-street.webp": "IMG_0695.JPG",
  "completed-home-01.webp": "IMG_0509.jpg",
  "completed-home-02.webp": "IMG_0543.jpg",
  "completed-home-03.webp": "IMG_0666.jpg",
  "completed-home-04.webp": "IMG_3312.jpg",
  "completed-residence.webp": "IMG_3242.jpg",
  "residence-exterior.webp": "IMG_3293.jpg",
  "residence-kitchen.webp": "IMG_3260.jpg",
  "residence-pool.webp": "IMG_3295.jpg",
  "development-progress-01.webp": "IMG_8629.jpg",
  "development-progress-02.webp": "IMG_9842.jpg",
  "development-progress-03.webp": "IMG_1341.jpg",
};

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  Object.entries(selections).map(async ([output, source]) => {
    await sharp(path.join(sourceDirectory, source))
      .rotate()
      .resize({ width: 2000, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(outputDirectory, output));
  }),
);

console.log(`Optimized ${Object.keys(selections).length} estate images.`);
