import * as React from "react";
import { SparklesIcon } from "lucide-react";

import { InsightCard } from "@/shared/components/insight-card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

/**
 * Insights Panel (Documento 09 — área 4): hipóteses, riscos,
 * oportunidades e recomendações em tempo real.
 *
 * Nesta fase de fundação exibe o estado vazio orientado; será alimentado
 * pelo Nutrition Decision Engine nos próximos módulos.
 */
function InsightsPanel() {
  return (
    <section
      aria-label="Insights estratégicos"
      className="flex h-full flex-col border-l bg-background"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <SparklesIcon className="size-4 text-gold" aria-hidden />
        <h2 className="text-sm font-medium">Insights</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          <InsightCard
            kind="recommendation"
            title="Nenhum aluno em análise"
            description="Abra um aluno para o sistema gerar hipóteses, riscos e oportunidades em tempo real."
          />
        </div>
      </ScrollArea>
    </section>
  );
}

export { InsightsPanel };
