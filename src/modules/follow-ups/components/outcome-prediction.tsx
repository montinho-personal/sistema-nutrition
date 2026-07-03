"use client";

import { CalendarClockIcon, GaugeIcon, TelescopeIcon, TrendingUpIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MetricCard } from "@/shared/components/metric-card";
import { SectionHeader } from "@/shared/components/section-header";
import type { OutcomePrediction, PredictionVerdict } from "@/modules/follow-ups/types";

const VERDICT: Record<
  PredictionVerdict,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  ahead: { label: "Adiantado", variant: "success" },
  on_track: { label: "No caminho da meta", variant: "success" },
  behind: { label: "Abaixo do previsto", variant: "warning" },
  stalled: { label: "Estagnado", variant: "warning" },
  reversing: { label: "Tendência contrária", variant: "destructive" },
  insufficient: { label: "Dados insuficientes", variant: "secondary" },
};

function kg(value: number): string {
  const abs = Math.abs(value).toFixed(1).replace(".", ",");
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${abs} kg`;
}

/**
 * Previsão de resultado (Documento 03F): a partir do ritmo real, projeta o
 * desfecho ante a meta — com confiança que cresce a cada acompanhamento.
 */
export function OutcomePredictionCard({ prediction }: { prediction: OutcomePrediction }) {
  const v = VERDICT[prediction.verdict];
  const insufficient = prediction.verdict === "insufficient";

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Previsão de resultado"
        description="O desfecho provável no ritmo atual, comparado à meta do plano."
      />

      <Card className="border-l-2 border-l-gold">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TelescopeIcon className="size-4 text-gold" />
              {insufficient
                ? "Ainda sem ritmo suficiente para prever"
                : `Projeção para o prazo de ${prediction.targetWeeks} semanas`}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={v.variant}>{v.label}</Badge>
              <Badge variant="secondary" className="tabular-nums">
                Confiança {prediction.confidence}%
              </Badge>
            </div>
          </div>

          {!insufficient ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Projeção no prazo"
                value={kg(prediction.projectedChangeKg)}
                delta={`meta ${kg(prediction.plannedChangeKg)}`}
                icon={<TrendingUpIcon />}
              />
              <MetricCard
                label="Peso projetado"
                value={`${prediction.projectedWeightAtTarget.toFixed(1).replace(".", ",")} kg`}
                delta="na data-alvo"
                icon={<GaugeIcon />}
              />
              <MetricCard
                label="No ritmo da meta"
                value={`${prediction.onTrackPct}%`}
                delta={prediction.gapKg > 0 ? `faltam ${kg(prediction.gapKg)}` : "meta coberta"}
                icon={<GaugeIcon />}
              />
              <MetricCard
                label="Meta atingida em"
                value={
                  prediction.weeksToGoal === null
                    ? "—"
                    : `${Math.max(0, Math.ceil(prediction.weeksToGoal))} sem`
                }
                delta="no ritmo atual"
                icon={<CalendarClockIcon />}
              />
            </div>
          ) : null}

          <p className="border-t pt-3 text-sm text-muted-foreground">{prediction.detail}</p>
        </CardContent>
      </Card>
    </section>
  );
}
