"use client";

import { ActivityIcon, ScaleIcon, TargetIcon } from "lucide-react";

import { MetricCard } from "@/shared/components/metric-card";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { STATUS_LABELS } from "@/modules/follow-ups/constants/parameters";
import type { Evolution, EvolutionInsight } from "@/modules/follow-ups/types";

const INSIGHT_KIND: Record<EvolutionInsight["kind"], InsightKind> = {
  risk: "risk",
  opportunity: "opportunity",
  recommendation: "recommendation",
};

function kg(value: number | null): string {
  if (value === null) return "—";
  const abs = Math.abs(value).toFixed(1).replace(".", ",");
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${abs} kg`;
}

function weeklyLabel(value: number | null): string {
  if (value === null) return "—";
  return `${kg(value)}/sem`;
}

/** Resumo da evolução: métricas-chave + recomendações (Documentos 03F/05). */
export function EvolutionSummary({
  evolution,
  insights,
}: {
  evolution: Evolution;
  insights: EvolutionInsight[];
}) {
  // Direção esperada: perda (negativa) ou ganho (positiva).
  const expectedDir = Math.sign(evolution.expectedWeeklyKg);
  const totalTrend =
    evolution.totalChangeKg < 0 ? "down" : evolution.totalChangeKg > 0 ? "up" : "flat";
  // Positivo quando a mudança segue a direção esperada.
  const totalIsPositive =
    expectedDir === 0
      ? Math.abs(evolution.totalChangeKg) < 0.5
      : Math.sign(evolution.totalChangeKg) === expectedDir;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Evolução"
        description="O ritmo real do aluno ante o previsto pela estratégia."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Peso atual"
          value={`${evolution.currentWeight.toFixed(1).replace(".", ",")} kg`}
          delta={`${kg(evolution.totalChangeKg)} no total`}
          trend={totalTrend}
          trendIsPositive={totalIsPositive}
          icon={<ScaleIcon />}
        />
        <MetricCard
          label="Ritmo real"
          value={weeklyLabel(evolution.actualWeeklyKg)}
          delta={`${evolution.weeksElapsed.toFixed(1).replace(".", ",")} semanas`}
          trend="flat"
          icon={<ActivityIcon />}
        />
        <MetricCard
          label="Ritmo esperado"
          value={weeklyLabel(evolution.expectedWeeklyKg)}
          delta="derivado dos macros"
          trend="flat"
          icon={<TargetIcon />}
        />
        <MetricCard
          label="Situação"
          value={STATUS_LABELS[evolution.status] ?? evolution.status}
        />
      </div>

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              kind={INSIGHT_KIND[insight.kind]}
              title={insight.title}
              description={insight.detail}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
