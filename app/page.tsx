import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { NewTicketForm } from "./(public)/_components/new-ticket-form";
import { getOptionalSession } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getOptionalSession();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 md:py-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Abrir un ticket de soporte
        </h1>
        <p className="text-muted-foreground">
          Cuéntanos qué está pasando y nuestro equipo se pondrá en contacto contigo. 
          Recibirás un enlace de seguimiento después de enviarlo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo ticket</CardTitle>
          <CardDescription>
            Los campos marcados como obligatorios deben ser completados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewTicketForm defaultCreator={session?.name} />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        ¿Ya tienes un ticket? Usa el enlace de seguimiento que te enviamos, o{" "}
        <Button asChild variant="link" className="px-0">
          <Link href="/admin">panel de personal</Link>
        </Button>
        .
      </p>
    </main>
  );
}
