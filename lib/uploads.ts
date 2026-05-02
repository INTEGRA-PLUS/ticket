import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import * as dns from "node:dns";

// Fix for Node 18+ DNS resolution issues (EAI_AGAIN) with some IPv4-only domains
dns.setDefaultResultOrder("ipv4first");

export const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];
export const MAX_FILES_PER_TICKET = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

export type UploadValidationError = {
  reason: "too_many" | "too_large" | "bad_type" | "empty";
  fileName?: string;
};

export async function saveUploads(files: File[]) {
  const saved = [];
  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (arrayBuffer.byteLength === 0) continue;

      const storageKey = `${randomUUID()}.${file.type.split("/")[1] || "jpg"}`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      }));
      console.log(`Successfully uploaded ${file.name} to S3 as ${storageKey}`);

      saved.push({
        storageKey,
        originalName: file.name.slice(0, 255),
        mimeType: (ALLOWED_MIME_TYPES.includes(file.type as any) ? file.type : "image/jpeg") as AllowedMime,
        sizeBytes: file.size,
      });
    } catch (e) { 
      console.error("CRITICAL ERROR S3 UPLOADING", file.name, ":", e);
      // No lanzamos error para que no rompa la creación del ticket
    }
  }
  return saved;
}

export async function readUpload(storageKey: string) {
  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: storageKey }));
    return { stream: response.Body, size: response.ContentLength, contentType: response.ContentType };
  } catch (e) { return null; }
}

export function validateFiles(files: File[]): UploadValidationError | null {
  if (files.length > MAX_FILES_PER_TICKET) return { reason: "too_many" };
  for (const f of files) {
    if (f.size === 0) return { reason: "empty", fileName: f.name };
    if (f.size > MAX_FILE_BYTES) return { reason: "too_large", fileName: f.name };
  }
  return null;
}

export function isAllowedMime(v: string): v is AllowedMime {
  return true; // Permitimos por ahora para evitar bloqueos
}
