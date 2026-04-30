"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  attachments,
  tickets,
  ticketStatus,
  type TicketStatus,
} from "@/lib/db/schema";
import { generatePublicId } from "@/lib/public-id";
import { verifySession } from "@/lib/auth/dal";
import {
  MAX_FILES_PER_TICKET,
  MAX_FILE_BYTES,
  saveUploads,
  validateFiles,
} from "@/lib/uploads";

const CreateTicketSchema = z.object({
  customerName: z.string().min(2, "Por favor introduce tu nombre").max(120).trim(),
  customerEmail: z.email("Introduce un correo válido").max(255).trim(),
  subject: z.string().min(4, "El asunto es demasiado corto").max(200).trim(),
  description: z
    .string()
    .min(10, "Por favor describe el problema (más de 10 caracteres)")
    .max(5000)
    .trim(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  createdBy: z.string().max(120).trim().optional(),
});

type CreateTicketFields = z.infer<typeof CreateTicketSchema>;
export type CreateTicketState = {
  errors?: Partial<Record<keyof CreateTicketFields, string[]>>;
  message?: string;
} | null;

function describeUploadError(
  reason: "too_many" | "too_large" | "bad_type" | "empty",
  fileName?: string,
): string {
  const sizeMb = Math.round(MAX_FILE_BYTES / (1024 * 1024));
  switch (reason) {
    case "too_many":
      return `Por favor adjunta como máximo ${MAX_FILES_PER_TICKET} imágenes.`;
    case "too_large":
      return `${fileName ?? "El archivo"} es más grande que ${sizeMb}MB.`;
    case "bad_type":
      return `${fileName ?? "El archivo"} no es una imagen compatible (PNG, JPG, WEBP, GIF).`;
    case "empty":
      return `${fileName ?? "El archivo"} está vacío.`;
  }
}

export async function createTicket(
  _state: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const parsed = CreateTicketSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority") ?? "medium",
    createdBy: formData.get("createdBy"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const fileError = validateFiles(files);
  if (fileError) {
    return { message: describeUploadError(fileError.reason, fileError.fileName) };
  }

  const publicId = generatePublicId();

  const [created] = await db
    .insert(tickets)
    .values({
      publicId,
      subject: parsed.data.subject,
      description: parsed.data.description,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail.toLowerCase(),
      priority: parsed.data.priority,
      createdBy: parsed.data.createdBy,
    })
    .returning({ id: tickets.id });

  if (created && files.length > 0) {
    const saved = await saveUploads(files);
    if (saved.length > 0) {
      await db.insert(attachments).values(
        saved.map((file) => ({
          ticketId: created.id,
          storageKey: file.storageKey,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        })),
      );
    }
  }

  redirect(`/tickets/${publicId}`);
}

const UpdateStatusSchema = z.object({
  ticketId: z.uuid(),
  status: z.enum(ticketStatus.enumValues),
});

export async function updateTicketStatus(formData: FormData) {
  const session = await verifySession();

  const parsed = UpdateStatusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  await db
    .update(tickets)
    .set({
      status: parsed.data.status as TicketStatus,
      updatedAt: new Date(),
      assignedToId: session.userId,
    })
    .where(eq(tickets.id, parsed.data.ticketId));

  revalidatePath("/admin");
  revalidatePath(`/admin/tickets/${parsed.data.ticketId}`);
}

export async function claimTicket(formData: FormData) {
  const session = await verifySession();
  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string") throw new Error("Invalid ticket id");

  await db
    .update(tickets)
    .set({ assignedToId: session.userId, updatedAt: new Date() })
    .where(eq(tickets.id, ticketId));

  revalidatePath("/admin");
  revalidatePath(`/admin/tickets/${ticketId}`);
}
