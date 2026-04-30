"use client";

import { useState, useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateTicketStatus } from "@/lib/tickets/actions";
import { TICKET_STATUS_LABELS } from "@/components/ticket-status-badge";
import type { TicketStatus } from "@/lib/db/schema";

const STATUSES = Object.entries(TICKET_STATUS_LABELS) as [
  TicketStatus,
  string,
][];

export function StatusForm({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketStatus;
}) {
  const [value, setValue] = useState<TicketStatus>(current);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(() => {
          updateTicketStatus(formData);
        })
      }
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="status" value={value} />
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="status">
          Estado
        </label>
        <Select
          value={value}
          onValueChange={(v) => setValue(v as TicketStatus)}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending || value === current}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
