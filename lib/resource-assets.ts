import { randomUUID } from "node:crypto";
import sharp from "sharp";

export async function prepareShowcaseImage(value: FormDataEntryValue | null, kind: "logo" | "artwork") {
  if (value === null || (value instanceof File && !value.size)) return null;
  if (!(value instanceof File) || value.size > 2 * 1024 * 1024) {
    throw new Error("Choose a PNG, JPEG, or WebP image under 2 MB.");
  }
  try {
    const bytes = Buffer.from(await value.arrayBuffer());
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!png && !jpeg && !webp) throw new Error();
    const image = sharp(bytes, { limitInputPixels: 12_000_000, failOn: "warning" });
    const { format, pages } = await image.metadata();
    if (!format || !["png", "jpeg", "webp"].includes(format) || (pages ?? 1) > 1) throw new Error();
    const size = kind === "logo" ? { width: 256, height: 256 } : { width: 1600, height: 1100 };
    const data = await image.rotate().resize({ ...size, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    if (data.length > 2 * 1024 * 1024) throw new Error();
    return { id: randomUUID(), data };
  } catch {
    throw new Error("Choose a valid PNG, JPEG, or WebP image under 12 megapixels.");
  }
}
