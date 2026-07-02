import * as React from "react";

import { cn } from "@/shared/lib/utils";

interface EmptyStateProps extends React.ComponentProps<"div"> {
  /** Ícone ilustrativo (lucide). */
  icon?: React.ReactNode;
  /** Título curto do estado vazio. */
  title: string;
  /** Orientação sobre o próximo passo — nunca apenas avisar (Documento 02). */
  description?: string;
  /** Ação sugerida (botão). */
  action?: React.ReactNode;
}

/** Estado vazio padrão: sempre orienta o próximo passo. */
function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-6">
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
