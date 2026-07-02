import * as React from "react";
import { BrainIcon } from "lucide-react";

import { ScrollArea } from "@/shared/components/ui/scroll-area";

/**
 * AI Strategy Panel (Documento 09 — área 5): resumo do raciocínio do
 * Nutrition Decision Engine — estratégias analisadas, alternativas,
 * justificativas e perguntas pendentes.
 *
 * Nunca ocultar completamente. Nesta fase de fundação apresenta o
 * estado inicial; será conectado ao NDE nos próximos módulos.
 */
function AiStrategyPanel() {
  return (
    <section
      aria-label="Raciocínio do Nutrition Decision Engine"
      className="flex h-full flex-col border-l bg-background"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <BrainIcon className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">Nutrition Decision Engine</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 text-sm leading-relaxed text-muted-foreground">
          O NDE acompanhará cada decisão com justificativas, alternativas analisadas e riscos —
          sempre explicando o porquê de cada escolha.
        </div>
      </ScrollArea>
    </section>
  );
}

export { AiStrategyPanel };
