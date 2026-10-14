// Phone photos are often 4000px+ and several MB. Shrinking them in the browser
// makes uploads fast and keeps them under the AI model's image size limits,
// while staying sharp enough to read small label print.

const MAX_EDGE = 1568;
const JPEG_QUALITY = 0.85;

/** Returns a resized JPEG as a data URL ("data:image/jpeg;base64,..."). */
export async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
