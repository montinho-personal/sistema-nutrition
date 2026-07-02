import * as React from "react";

import { Badge } from "@/shared/components/ui/badge";

export type ModuleStatus = "completed" | "in_progress" | "pending";

const statusConfig: Record<
  ModuleStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  completed: { label: "Concluído", variant: "success" },
  in_progress: { label: "Em andamento", variant: "warning" },
  pending: { label: "Pendente", variant: "secondary" },
};

interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "variant"> {
  status: ModuleStatus;
}

/**
 * Status Badge: estado padronizado dos módulos na jornada do aluno
 * (Documento 09 — Sidebar: Concluído / Em andamento / Pendente).
 */
function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} {...props}>
      {config.label}
    </Badge>
  );
}

export { StatusBadge };
