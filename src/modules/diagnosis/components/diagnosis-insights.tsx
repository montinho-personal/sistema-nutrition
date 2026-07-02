"use client";

import * as React from "react";
import { SparklesIcon } from "lucide-react";

import { ScoreCard } from "@/shared/components/score-card";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { HIGHLIGHTED_SCORES, SCORE_LABELS, INVERTED_SCORES } from "@/modules/diagnosis/constants";
import { computeHypotheses, computeScoreMap } from "@/modules/diagnosis/services";
import type { AnswerMap, Hypothesis } from "@/modules/diagnosis/types";

const dimensionToKind: Record<Hypothesis["dimension"], InsightKind> = {
  risk: "risk",
  difficulty: "risk",
  opportunity: "opportunity",
  advantage: "opportunity",
};

/**
 * Painel de inteligência em tempo real (Documento 07/09): scores parciais
 * e hipóteses que o sistema já percebeu enquanto a entrevista acontece.
 */
export function DiagnosisInsights({ answers }: { answers: AnswerMap }) {
  const scores = React.useMemo(() => computeScoreMap(answers), [answers]);
  const hypotheses = React.useMemo(() => computeHypotheses(answers), [answers]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {HIGHLIGHTED_SCORES.map((key) => (
          <ScoreCard
            key={key}
            label={SCORE_LABELS[key]}
            score={scores[key]}
            invert={INVERTED_SCORES.includes(key)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <SparklesIcon className="size-3.5 text-gold" />O que o sistema já percebeu
        </div>
        {hypotheses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Conforme você responde, hipóteses e riscos aparecem aqui em tempo real.
          </p>
        ) : (
          hypotheses
            .slice(0, 4)
            .map((h) => (
              <InsightCard
                key={h.id}
                kind={dimensionToKind[h.dimension]}
                title={h.title}
                confidence={h.confidence}
              />
            ))
        )}
      </div>
    </div>
  );
}
