import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const MAGIC: Record<string, { bytes: number[]; ext: string; mime: string }> = {
  jpeg: { bytes: [0xff, 0xd8, 0xff], ext: "jpg", mime: "image/jpeg" },
  png: { bytes: [0x89, 0x50, 0x4e, 0x47], ext: "png", mime: "image/png" },
  gif: { bytes: [0x47, 0x49, 0x46, 0x38], ext: "gif", mime: "image/gif" },
  webp: { bytes: [0x52, 0x49, 0x46, 0x46], ext: "webp", mime: "image/webp" },
  pdf: { bytes: [0x25, 0x50, 0x44, 0x46], ext: "pdf", mime: "application/pdf" },
};

export function detectMagic(buffer: Buffer) {
  for (const [kind, spec] of Object.entries(MAGIC)) {
    if (spec.bytes.every((b, i) => buffer[i] === b)) {
      if (kind === "webp" && buffer.toString("ascii", 8, 12) !== "WEBP") continue;
      return { kind, ...spec };
    }
  }
  return null;
}

export function isAllowedUpload(
  detected: ReturnType<typeof detectMagic>,
  purpose: "avatar" | "attachment",
) {
  if (!detected) return false;
  if (purpose === "avatar") return detected.mime.startsWith("image/");
  return true;
}

export async function saveLocalUpload(
  buffer: Buffer,
  detected: NonNullable<ReturnType<typeof detectMagic>>,
) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${detected.ext}`;
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}
