import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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

// --- CONFIGURACIÓN MINIO HARDCODEADA ---
const s3Client = new S3Client({
  endpoint: "https://s3images.integracolombia.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "uI2IU2TS826sQbiQkunDEzddw",
  },
  forcePathStyle: true, 
});

const BUCKET_NAME = "ticket";
// ---------------------------------------

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

  const saved: SavedUpload[] = [];
  for (const file of files) {
    if (!isAllowedMime(file.type)) continue;
    
    const ext = EXTENSIONS[file.type];
    const storageKey = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storageKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      saved.push({
        storageKey,
        originalName: file.name.slice(0, 255),
        mimeType: file.type,
        sizeBytes: file.size,
      });
    } catch (error) {
      console.error("Error subiendo a MinIO:", error);
    }
  }
  return saved;
}

export async function readUpload(storageKey: string) {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
      })
    );
    return { 
      stream: response.Body, 
      size: response.ContentLength,
      contentType: response.ContentType 
    };
  } catch (error) {
    console.error("Error leyendo de MinIO:", error);
    return null;
  }
}
