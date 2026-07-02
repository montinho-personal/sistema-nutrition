"use client";

import * as React from "react";
import { AlertTriangleIcon, LightbulbIcon, TargetIcon, UtensilsCrossedIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ScoreCard } from "@/shared/components/score-card";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { INVERTED_SCORES, SCORE_LABELS } from "@/modules/diagnosis/constants";
import {
  ageFromBirthDate,
  buildAnamnesePortrait,
  buildExecutiveSummary,
  computeHypotheses,
  computeScores,
} from "@/modules/diagnosis/services";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { AnswerMap, Hypothesis } from "@/modules/diagnosis/types";
import type { Student } from "@/modules/students/types";

const dimensionToKind: Record<Hypothesis["dimension"], InsightKind> = {
  risk: "risk",
  difficulty: "risk",
  opportunity: "opportunity",
  advantage: "opportunity",
};

/**
 * Resumo Executivo do diagnóstico (Documento 06): perfil, riscos,
 * oportunidades, scores e hipóteses. O "Resumo Inteligente" (Documento 05):
 * primeiro a inteligência, depois os detalhes.
 */
export function DiagnosisSummary({ answers, student }: { answers: AnswerMap; student: Student }) {
  const summary = React.useMemo(
    () =>
      buildExecutiveSummary(answers, {
        goalLabel: student.mainGoal ? STUDENT_GOAL_LABELS[student.mainGoal] : null,
        ageYears: ageFromBirthDate(student.birthDate),
      }),
    [answers, student],
  );
  const scores = React.useMemo(() => computeScores(answers), [answers]);
  const hypotheses = React.useMemo(() => computeHypotheses(answers), [answers]);
  const portrait = React.useMemo(() => buildAnamnesePortrait(answers), [answers]);

  return (
    <div className="flex flex-col gap-6">
      {/* Resumo executivo */}
      <Card className="border-l-2 border-l-gold">
        <CardHeader>
          <CardTitle className="text-base">Resumo estratégico — {student.fullName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">{summary.profile}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Highlight
              icon={<AlertTriangleIcon className="size-4 text-warning" />}
              label="Maior dificuldade"
              value={summary.mainDifficulty}
            />
            <Highlight
              icon={<LightbulbIcon className="size-4 text-success" />}
              label="Maior oportunidade"
              value={summary.mainOpportunity}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Estratégias promissoras
            </span>
            <ul className="flex flex-col gap-1">
              {summary.promisingStrategies.map((strategy) => (
                <li key={strategy} className="flex items-start gap-2 text-sm">
                  <TargetIcon className="mt-0.5 size-3.5 shrink-0 text-gold" />
                  {strategy}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scores */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Scores do diagnóstico"
          description="Indicadores que orientam a estratégia (0–100)."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {scores.map((s) => (
            <ScoreCard
              key={s.key}
              label={SCORE_LABELS[s.key]}
              score={s.score}
              invert={INVERTED_SCORES.includes(s.key)}
            />
          ))}
        </div>
      </section>

      {/* Hipóteses */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Hipóteses"
          description="O que o sistema concluiu, com nível de confiança."
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {hypotheses.map((h) => (
            <InsightCard
              key={h.id}
              kind={dimensionToKind[h.dimension]}
              title={h.title}
              description={h.justification}
              confidence={h.confidence}
            />
          ))}
        </div>
      </section>

      {/* Retrato alimentar — o que o aluno de fato come e prefere */}
      {portrait.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Retrato alimentar"
            description="O que o aluno relatou na anamnese — a base concreta para a estratégia."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {portrait.map((grp) => (
              <Card key={grp.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <UtensilsCrossedIcon className="size-4 text-gold" />
                    {grp.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-2">
                    {grp.items.map((item) => (
                      <div key={item.label} className="flex flex-col gap-0.5">
                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {item.label}
                        </dt>
                        <dd className="text-sm">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Highlight({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
      <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </span>
      <span className="text-sm">{value ?? "Sem sinal relevante."}</span>
    </div>
  );
}
