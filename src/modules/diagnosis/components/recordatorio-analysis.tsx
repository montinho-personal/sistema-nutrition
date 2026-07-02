"use client";

import * as React from "react";
import { UtensilsCrossedIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { analyzeRecordatorio } from "@/modules/diagnosis/services";
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
    </section>
  );
}
