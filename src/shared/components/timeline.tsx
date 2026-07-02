import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export interface TimelineItem {
  /** Identificador estável do item. */
  id: string;
  /** Título da etapa. */
  title: string;
  /** Descrição curta opcional. */
  description?: string;
  /** Estado da etapa na jornada. */
  status: "completed" | "current" | "upcoming";
}

interface TimelineProps extends React.ComponentProps<"ol"> {
  items: TimelineItem[];
}

/**
 * Timeline vertical do Design System — linha do tempo da transformação
 * (Documento 03E) e progresso de etapas.
 */
function Timeline({ items, className, ...props }: TimelineProps) {
  return (
    <ol className={cn("flex flex-col", className)} {...props}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-6 left-[11px] h-full w-px",
                  item.status === "completed" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                item.status === "completed" && "border-primary bg-primary text-primary-foreground",
                item.status === "current" && "border-2 border-gold bg-background text-foreground",
                item.status === "upcoming" && "bg-background text-muted-foreground",
              )}
            >
              {item.status === "completed" ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span
                className={cn(
                  "text-sm leading-none font-medium",
                  item.status === "upcoming" && "text-muted-foreground",
                )}
              >
                {item.title}
              </span>
              {item.description ? (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { Timeline };
