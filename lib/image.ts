import sharp from "sharp";

/** Every admin upload is stored as WebP: auto-rotated, max 1600px, quality 82. */
export async function toWebp(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const img = sharp(input, { animated: true, failOn: "error" }).rotate();
  const { data, info } = await img
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
