import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PriorityBadge,
  StatusBadge,
} from "@/components/ticket-status-badge";
import { db } from "@/lib/db";
import { tickets, attachments } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function TicketPage(
  props: PageProps<"/tickets/[publicId]">,
) {
  const { publicId } = await props.params;

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.publicId, publicId))
    .limit(1);

  if (!ticket) notFound();

  const ticketAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.ticketId, ticket.id));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 md:py-20">
      <Button asChild variant="ghost" className="self-start px-0">
        <Link href="/">← Enviar otro ticket</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <CardDescription>
                Referencia{" "}
                <span className="font-mono">{ticket.publicId}</span> · abierto el{" "}
                {new Intl.DateTimeFormat(["es", "en"], {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(ticket.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Enviado por
            </p>
            <p>
              {ticket.customerName}{" "}
              <span className="text-muted-foreground">
                ({ticket.customerEmail})
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Detalles</p>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>
          {ticketAttachments.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Adjuntos</p>
              <div className="flex flex-wrap gap-4">
                {ticketAttachments.map((a) => (
                  <a
                    key={a.id}
                    href={`/api/attachments/${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-md border bg-muted/50 transition-colors hover:bg-muted"
                  >
                    {a.mimeType.startsWith("image/") ? (
                      <img
                        src={`/api/attachments/${a.id}`}
                        alt={a.originalName}
                        className="h-32 w-32 object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-32 flex-col items-center justify-center p-2 text-center text-xs">
                        <span className="w-full truncate">{a.originalName}</span>
                        <span className="mt-1 text-muted-foreground">
                          {(a.sizeBytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Guarda esta página para consultar el estado más reciente. Te responderemos por
            correo electrónico cuando haya una actualización.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
