"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";

interface LoadingScreenProps extends React.ComponentProps<"div"> {
  /**
   * Mensagens de raciocínio exibidas em rotação.
   * Documento 02: nunca mostrar apenas "Carregando..." — o loading
   * comunica a inteligência do sistema.
   */
  messages?: string[];
}

const defaultMessages = [
  "O Nutrition Decision Engine está analisando...",
  "O sistema está comparando estratégias...",
  "Calculando aderência...",
  "Estimando risco...",
];

/** Tela de carregamento com mensagens de raciocínio do sistema. */
function LoadingScreen({ messages = defaultMessages, className, ...props }: LoadingScreenProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-h-[320px] flex-col items-center justify-center gap-4", className)}
      {...props}
    >
      <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-gold" />
      <p className="text-sm text-muted-foreground">{messages[index]}</p>
    </div>
  );
}

export { LoadingScreen };
