import "server-only";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILES_PER_TICKET = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<AllowedMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function uploadDir(): string {
  return resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export type SavedUpload = {
  storageKey: string;
  originalName: string;
  mimeType: AllowedMime;
  sizeBytes: number;
};

export function isAllowedMime(value: string): value is AllowedMime {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export type UploadValidationError = {
  reason: "too_many" | "too_large" | "bad_type" | "empty";
  fileName?: string;
};

export function validateFiles(files: File[]): UploadValidationError | null {
  if (files.length > MAX_FILES_PER_TICKET) {
    return { reason: "too_many" };
  }
  for (const file of files) {
    if (file.size === 0) return { reason: "empty", fileName: file.name };
    if (file.size > MAX_FILE_BYTES) {
      return { reason: "too_large", fileName: file.name };
    }
    if (!isAllowedMime(file.type)) {
      return { reason: "bad_type", fileName: file.name };
    }
  }
  return null;
}

export async function saveUploads(files: File[]): Promise<SavedUpload[]> {
  if (files.length === 0) return [];
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const saved: SavedUpload[] = [];
  for (const file of files) {
    if (!isAllowedMime(file.type)) continue;
    const ext = EXTENSIONS[file.type];
    const storageKey = `${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, storageKey), buf);
    saved.push({
      storageKey,
      originalName: file.name.slice(0, 255),
      mimeType: file.type,
      sizeBytes: file.size,
    });
  }
  return saved;
}

export async function readUpload(storageKey: string) {
  if (!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/i.test(storageKey)) {
    return null;
  }
  const path = join(uploadDir(), storageKey);
  try {
    const info = await stat(path);
    if (!info.isFile()) return null;
    return { path, size: info.size };
  } catch {
    return null;
  }
}

export function streamUpload(path: string) {
  return createReadStream(path);
}
