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
import { tickets, users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/dal";
import { claimTicket } from "@/lib/tickets/actions";

import { StatusForm } from "./_components/status-form";

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
                {new Intl.DateTimeFormat("es", {
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
