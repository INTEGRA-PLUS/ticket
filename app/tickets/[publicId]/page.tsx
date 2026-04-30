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
import { tickets } from "@/lib/db/schema";

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
                {new Intl.DateTimeFormat("es", {
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
          <p className="text-sm text-muted-foreground">
            Guarda esta página para consultar el estado más reciente. Te responderemos por
            correo electrónico cuando haya una actualización.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
