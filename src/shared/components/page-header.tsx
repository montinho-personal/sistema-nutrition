import * as React from "react";

import { cn } from "@/shared/lib/utils";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  /** Título da página — um objetivo principal por tela (Documento 02). */
  title: string;
  /** Descrição curta do objetivo da tela. */
  description?: string;
  /** Ações da página (botões), alinhadas à direita. */
  actions?: React.ReactNode;
}

/** Cabeçalho padrão de página. */
function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
