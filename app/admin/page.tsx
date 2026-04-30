import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PriorityBadge,
  StatusBadge,
} from "@/components/ticket-status-badge";
import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/dal";

import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await verifySession();

  const allTickets = await db
    .select()
    .from(tickets)
    .orderBy(desc(tickets.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Todos los tickets</h1>
          <p className="text-muted-foreground">
            Listado completo de tickets en el sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/">+ Nuevo ticket</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Tickets recientes</CardTitle>
          <CardDescription>
            {allTickets.length} ticket{allTickets.length === 1 ? "" : "s"} en total
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {allTickets.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              No hay tickets creados todavía.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Asunto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="pr-6">Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="pl-6 font-medium">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        #{ticket.publicId}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{ticket.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.customerEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{ticket.createdBy || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell className="pr-6 text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat(["es", "en"], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(ticket.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
