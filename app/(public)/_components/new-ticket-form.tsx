"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTicket,
  type CreateTicketState,
} from "@/lib/tickets/actions";
import { FilePicker } from "./file-picker";

export function NewTicketForm({ defaultCreator }: { defaultCreator?: string }) {
  const [state, formAction, pending] = useActionState<
    CreateTicketState,
    FormData
  >(createTicket, null);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <FieldGroup
          label="Tu nombre"
          name="customerName"
          error={state?.errors?.customerName}
        >
          <Input name="customerName" autoComplete="name" required />
        </FieldGroup>
        <FieldGroup
          label="Correo electrónico"
          name="customerEmail"
          error={state?.errors?.customerEmail}
        >
          <Input
            type="email"
            name="customerEmail"
            autoComplete="email"
            required
          />
        </FieldGroup>
      </div>

      <FieldGroup
        label="Creado por"
        name="createdBy"
        error={state?.errors?.createdBy}
      >
        <Input name="createdBy" defaultValue={defaultCreator} placeholder="Nombre del personal o identificador" />
      </FieldGroup>

      <FieldGroup
        label="Asunto"
        name="subject"
        error={state?.errors?.subject}
      >
        <Input name="subject" maxLength={200} required />
      </FieldGroup>

      <FieldGroup
        label="Prioridad"
        name="priority"
        error={state?.errors?.priority}
      >
        <Select name="priority" defaultValue="medium">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup
        label="¿En qué podemos ayudarte?"
        name="description"
        error={state?.errors?.description}
      >
        <Textarea
          name="description"
          rows={6}
          placeholder="Describe lo que está pasando, incluyendo cualquier paso para reproducirlo."
          required
        />
      </FieldGroup>

      <FieldGroup label="Adjuntos (opcional)" name="attachments">
        <FilePicker name="attachments" />
      </FieldGroup>

      {state?.message ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Enviando…" : "Enviar ticket"}
      </Button>
    </form>
  );
}

function FieldGroup({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error?.length ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}
