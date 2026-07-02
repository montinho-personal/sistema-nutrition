"use client";

import { ActivityIcon, RulerIcon, ScaleIcon, TargetIcon } from "lucide-react";

import { MetricCard } from "@/shared/components/metric-card";
import { InsightCard, type InsightKind } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { MEASUREMENT_LABELS, STATUS_LABELS } from "@/modules/follow-ups/constants/parameters";
import type { Evolution, EvolutionInsight, MeasurementDelta } from "@/modules/follow-ups/types";

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

function cm(value: number): string {
  const abs = Math.abs(value).toFixed(1).replace(".", ",");
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${abs} cm`;
}

/** Resumo da evolução: métricas-chave + medidas + recomendações (Docs 03F/05). */
export function EvolutionSummary({
  evolution,
  insights,
  measurementDeltas = [],
}: {
  evolution: Evolution;
  insights: EvolutionInsight[];
  measurementDeltas?: MeasurementDelta[];
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

      {measurementDeltas.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <RulerIcon className="size-3.5" />
            Medidas corporais
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {measurementDeltas.map((d) => (
              <div key={d.key} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{MEASUREMENT_LABELS[d.key]}</span>
                <span className="text-sm tabular-nums">
                  {d.last.toFixed(1).replace(".", ",")} cm
                  {d.deltaCm !== 0 ? (
                    <span
                      className={
                        d.deltaCm < 0 ? "ml-1.5 text-success" : "ml-1.5 text-muted-foreground"
                      }
                    >
                      {cm(d.deltaCm)}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
