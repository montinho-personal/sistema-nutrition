"use client";

import * as React from "react";
import { SparklesIcon, UtensilsCrossedIcon } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { isAiEnabled } from "@/config/env";
import { analyzeRecordatorio } from "@/modules/diagnosis/services";
import { interpretRecordatorioAction } from "@/modules/diagnosis/services/interpretRecordatorio.action";
import type { RecordatorioObservation } from "@/modules/diagnosis/services";
import type { AnswerMap } from "@/modules/diagnosis/types";

const OBS_KIND: Record<string, InsightKind> = {
  risk: "risk",
  opportunity: "opportunity",
  recommendation: "recommendation",
};

/**
 * Leitura clínica do "dia alimentar" (Documento 05): o que o sistema reconheceu
 * em cada refeição + observações acionáveis. Determinístico — a IA opcional
 * (V2) só enriquece o que a regra não captura.
 */
export function RecordatorioAnalysis({ answers }: { answers: AnswerMap }) {
  const analysis = React.useMemo(() => analyzeRecordatorio(answers), [answers]);
  const [aiObs, setAiObs] = React.useState<RecordatorioObservation[] | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  const runAi = async () => {
    setAiLoading(true);
    try {
      const res = await interpretRecordatorioAction(answers);
      if (res.status === "ok") {
        setAiObs(res.observations);
        if (res.observations.length === 0) toast.info("A IA não encontrou nada além do que já foi apontado.");
      } else if (res.status === "unavailable") {
        toast.error("A IA não está configurada neste ambiente.");
      } else {
        toast.error("Não foi possível analisar com IA agora. A análise automática segue válida.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (!analysis.hasData) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Análise do dia alimentar"
        description="O sistema leu o recordatório e cruzou com o Banco de Alimentos."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {analysis.meals
          .filter((meal) => meal.text.trim())
          .map((meal) => (
            <Card key={meal.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <UtensilsCrossedIcon className="size-4 text-gold" />
                  {meal.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{meal.text}</p>
                {meal.matchedFoods.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {meal.matchedFoods.map((name) => (
                      <Badge key={name} variant="secondary" className="font-normal">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Nenhum alimento do banco reconhecido automaticamente.
                  </span>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {meal.hasProtein ? (
                    <Badge variant="success">Tem proteína</Badge>
                  ) : (
                    <Badge variant="warning">Sem proteína</Badge>
                  )}
                  {meal.hasVeg ? <Badge variant="success">Tem vegetais/fruta</Badge> : null}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {analysis.observations.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {analysis.observations.map((obs) => (
            <InsightCard
              key={obs.id}
              kind={OBS_KIND[obs.kind]}
              title={obs.title}
              description={obs.detail}
            />
          ))}
        </div>
      ) : null}

      {/* Enriquecimento por IA (opcional) — só quando habilitado. */}
      {isAiEnabled ? (
        <div className="flex flex-col gap-2">
          {aiObs === null ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => void runAi()}
              disabled={aiLoading}
            >
              <SparklesIcon className="size-4 text-gold" />
              {aiLoading ? "A IA está analisando..." : "Aprofundar com IA"}
            </Button>
          ) : aiObs.length > 0 ? (
            <>
              <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <SparklesIcon className="size-3.5 text-gold" />
                Leitura da IA
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {aiObs.map((obs) => (
                  <InsightCard
                    key={obs.id}
                    kind={OBS_KIND[obs.kind]}
                    title={obs.title}
                    description={obs.detail}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
