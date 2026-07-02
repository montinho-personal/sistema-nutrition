import * as React from "react";

import { cn } from "@/shared/lib/utils";

interface SectionHeaderProps extends React.ComponentProps<"div"> {
  /** Título da seção. */
  title: string;
  /** Descrição curta opcional. */
  description?: string;
  /** Ações da seção, alinhadas à direita. */
  actions?: React.ReactNode;
}

/** Cabeçalho padrão de seção dentro de uma página. */
function SectionHeader({ title, description, actions, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { SectionHeader };
