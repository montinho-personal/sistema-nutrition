"use client";

import { AlertTriangleIcon, LightbulbIcon, TargetIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { ScoreCard } from "@/shared/components/score-card";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { INVERTED_SCORES, SCORE_LABELS } from "@/modules/diagnosis/constants";
import type { Hypothesis } from "@/modules/diagnosis/types";
import { StrategyResult } from "@/modules/strategy/components/strategy-result";
import { MacroSummary } from "@/modules/strategy/components/macro-summary";
import { MealCard } from "@/modules/meal-plan/components/meal-card";
import { EvolutionSummary } from "@/modules/follow-ups/components/evolution-summary";
import { TransformationPanel } from "@/modules/roadmap/components/transformation-panel";
import type { ReportModel } from "@/modules/reports/types";

const dimensionToKind: Record<Hypothesis["dimension"], InsightKind> = {
  risk: "risk",
  difficulty: "risk",
  opportunity: "opportunity",
  advantage: "opportunity",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="flex flex-col gap-4 print:break-inside-avoid">{children}</section>;
}

/** Documento consolidado do aluno — padrão de consultoria (Documento 02). */
export function ReportDocument({ report }: { report: ReportModel }) {
  const { meta, summary } = report;

  return (
    <div className="flex flex-col gap-8">
      {/* Capa */}
      <div className="flex flex-col gap-2 border-b pb-6">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span className="flex size-5 items-center justify-center rounded bg-gold text-[10px] font-bold text-gold-foreground">
            M
          </span>
          Montinho Nutrition Strategy · Relatório estratégico
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.studentName}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {meta.goalLabel ? <Badge variant="secondary">{meta.goalLabel}</Badge> : null}
          {meta.ageYears ? <span>{meta.ageYears} anos</span> : null}
          <span>· Peso inicial {meta.startWeightKg.toFixed(1).replace(".", ",")} kg</span>
          {meta.bodyFatPct ? <span>· {meta.bodyFatPct}% de gordura</span> : null}
          <span>· Gerado em {formatDate(meta.generatedAt)}</span>
          <span>· Confiança do diagnóstico {meta.confidence}%</span>
        </div>
      </div>

      {/* Resumo executivo */}
      <Section>
        <SectionHeader
          title="Resumo executivo"
          description="Quem é o aluno hoje — a inteligência antes dos detalhes."
        />
        <Card className="border-l-2 border-l-gold">
          <CardContent className="flex flex-col gap-4 pt-6">
            <p className="text-sm">{summary.profile}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <AlertTriangleIcon className="size-3.5 text-warning" />
                  Maior dificuldade
                </span>
                <span className="text-sm">{summary.mainDifficulty ?? "Sem sinal relevante."}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <LightbulbIcon className="size-3.5 text-success" />
                  Maior oportunidade
                </span>
                <span className="text-sm">{summary.mainOpportunity ?? "Sem sinal relevante."}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Estratégias promissoras
              </span>
              <ul className="flex flex-col gap-1">
                {summary.promisingStrategies.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <TargetIcon className="mt-0.5 size-3.5 shrink-0 text-gold" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {report.scores.map((s) => (
            <ScoreCard
              key={s.key}
              label={SCORE_LABELS[s.key]}
              score={s.score}
              invert={INVERTED_SCORES.includes(s.key)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {report.hypotheses.map((h) => (
            <InsightCard
              key={h.id}
              kind={dimensionToKind[h.dimension]}
              title={h.title}
              description={h.justification}
              confidence={h.confidence}
            />
          ))}
        </div>
      </Section>

      <Separator />

      {/* Estratégia */}
      <StrategyResult strategy={report.strategy} />

      <Separator />

      {/* Macros */}
      <MacroSummary macros={report.macros} />

      <Separator />

      {/* Plano alimentar */}
      <Section>
        <SectionHeader
          title="Plano Alimentar"
          description="O cardápio do dia — consequência das decisões estratégicas."
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {report.mealPlan.meals.map((meal) => (
            <MealCard key={meal.slot} meal={meal} />
          ))}
        </div>
        <Card>
          <CardContent className="flex flex-col gap-1.5 pt-6 text-sm text-muted-foreground">
            {report.mealPlan.notes.map((note) => (
              <div key={note} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      {/* Evolução (quando houver acompanhamentos) */}
      {report.evolution ? (
        <>
          <Separator />
          <Section>
            <EvolutionSummary
              evolution={report.evolution}
              insights={report.evolutionInsights}
            />
          </Section>
        </>
      ) : null}

      <Separator />

      {/* Roadmap */}
      <Section>
        <SectionHeader
          title="Roadmap da transformação"
          description="Onde o aluno está na jornada e o próximo passo."
        />
        <TransformationPanel roadmap={report.roadmap} />
      </Section>
    </div>
  );
}
