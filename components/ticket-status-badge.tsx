import { Badge } from "@/components/ui/badge";
import type { TicketPriority, TicketStatus } from "@/lib/db/schema";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  waiting_customer: "Esperando cliente",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const STATUS_VARIANTS: Record<
  TicketStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "default",
  in_progress: "secondary",
  waiting_customer: "outline",
  resolved: "outline",
  closed: "outline",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}

const PRIORITY_VARIANTS: Record<
  TicketPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANTS[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export const TICKET_STATUS_LABELS = STATUS_LABELS;
