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
import { tickets, users, attachments } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/dal";
import { claimTicket } from "@/lib/tickets/actions";

import { StatusForm } from "./_components/status-form";

export const dynamic = "force-dynamic";

export default async function AdminTicketPage(
  props: PageProps<"/admin/tickets/[id]">,
) {
  await verifySession();
  const { id } = await props.params;

  const [row] = await db
    .select({ ticket: tickets, assignee: users })
    .from(tickets)
    .leftJoin(users, eq(users.id, tickets.assignedToId))
    .where(eq(tickets.id, id))
    .limit(1);

  if (!row) notFound();

  const { ticket, assignee } = row;

  const ticketAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.ticketId, ticket.id));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Button asChild variant="ghost" className="self-start px-0">
        <Link href="/admin">← Volver al panel</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <CardDescription>
                #{ticket.publicId} · abierto el{" "}
                {new Intl.DateTimeFormat(["es", "en"], {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(ticket.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Cliente
            </p>
            <p>
              {ticket.customerName}{" "}
              <span className="text-muted-foreground">
                ({ticket.customerEmail})
              </span>
            </p>
          </div>

          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Descripción
            </p>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticketAttachments.length > 0 && (
            <div className="grid gap-1">
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

          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Asignado a
            </p>
            {assignee ? (
              <p>
                {assignee.name}{" "}
                <span className="text-muted-foreground">
                  ({assignee.email})
                </span>
              </p>
            ) : (
              <form action={claimTicket}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <Button type="submit" size="sm" variant="outline">
                  Reclamar ticket
                </Button>
              </form>
            )}
          </div>

          <hr className="border-border" />

          <StatusForm ticketId={ticket.id} current={ticket.status} />
        </CardContent>
      </Card>
    </main>
  );
}
