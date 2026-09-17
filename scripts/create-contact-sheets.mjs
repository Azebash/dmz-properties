import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [inputDirectory, outputDirectory] = process.argv.slice(2);

if (!inputDirectory || !outputDirectory) {
  throw new Error("Usage: node scripts/create-contact-sheets.mjs <input> <output>");
}

const files = (await readdir(inputDirectory))
  .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
  .sort(new Intl.Collator(undefined, { numeric: true }).compare);

await mkdir(outputDirectory, { recursive: true });

const columns = 5;
const rows = 4;
const cellWidth = 280;
const cellHeight = 205;
const imageHeight = 170;
const perSheet = columns * rows;

for (let start = 0; start < files.length; start += perSheet) {
  const batch = files.slice(start, start + perSheet);
  const composites = await Promise.all(
    batch.map(async (file, index) => {
      const image = await sharp(path.join(inputDirectory, file))
        .rotate()
        .resize(cellWidth, imageHeight, { fit: "cover" })
        .jpeg({ quality: 72 })
        .toBuffer();
      const label = await sharp({
        text: {
          text: file,
          font: "Arial",
          fontfile: undefined,
          width: cellWidth,
          height: cellHeight - imageHeight,
          align: "center",
          rgba: true,
        },
      })
        .flatten({ background: "#f5f7f2" })
        .png()
        .toBuffer();

      return [
        {
          input: image,
          left: (index % columns) * cellWidth,
          top: Math.floor(index / columns) * cellHeight,
        },
        {
          input: label,
          left: (index % columns) * cellWidth,
          top: Math.floor(index / columns) * cellHeight + imageHeight,
        },
      ];
    }),
  );

  const sheetNumber = String(Math.floor(start / perSheet) + 1).padStart(2, "0");
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 3,
      background: "#d9ddd7",
    },
  })
    .composite(composites.flat())
    .jpeg({ quality: 84 })
    .toFile(path.join(outputDirectory, `contact-sheet-${sheetNumber}.jpg`));
}

console.log(`Created ${Math.ceil(files.length / perSheet)} contact sheets for ${files.length} images.`);
