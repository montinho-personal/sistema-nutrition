"use client";

import * as React from "react";
import { GaugeIcon, HeartPulseIcon, ScaleIcon, TrendingUpIcon, WandSparklesIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { MetricCard } from "@/shared/components/metric-card";
import { InsightCard } from "@/shared/components/insight-card";
import { SectionHeader } from "@/shared/components/section-header";
import { projectGoal } from "@/modules/strategy/services";
import type { EnergyDirection, RealismLevel, StrategyVelocity } from "@/modules/strategy/types";

interface GoalDefinitionProps {
  direction: EnergyDirection;
  velocity: StrategyVelocity;
  tdee: number;
  currentWeightKg: number;
  capacity: number;
  prescribedDeltaPct: number;
  trainsRegularly: boolean;
  proteinAdequate: boolean;
  initialTargetKg: number | null;
  initialWeeks: number | null;
  onPersist: (targetChangeKg: number | null, weeks: number | null) => void;
}

const REALISM_BADGE: Record<RealismLevel, { label: string; variant: "success" | "warning" | "destructive" }> = {
  tranquilo: { label: "Meta tranquila", variant: "success" },
  ambicioso: { label: "Meta ambiciosa", variant: "warning" },
  irrealista: { label: "Meta irrealista", variant: "destructive" },
};

const verb = (d: EnergyDirection) => (d === "deficit" ? "perder" : "ganhar");

/**
 * Definição Estratégica (Documento 04): o treinador informa a meta (kg) e o
 * prazo (semanas); o sistema projeta ritmo, realismo, perda de massa magra,
 * aderência e riscos — sempre com uma alternativa realista. Honestidade antes
 * da promessa.
 */
export function GoalDefinition({
  direction,
  velocity,
  tdee,
  currentWeightKg,
  capacity,
  prescribedDeltaPct,
  trainsRegularly,
  proteinAdequate,
  initialTargetKg,
  initialWeeks,
  onPersist,
}: GoalDefinitionProps) {
  const [targetKg, setTargetKg] = React.useState<number | null>(initialTargetKg);
  const [weeks, setWeeks] = React.useState<number | null>(initialWeeks);

  const update = (nextTarget: number | null, nextWeeks: number | null) => {
    setTargetKg(nextTarget);
    setWeeks(nextWeeks);
    onPersist(nextTarget, nextWeeks);
  };

  const projection = React.useMemo(() => {
    if (!targetKg || targetKg <= 0 || !weeks || weeks <= 0) return null;
    return projectGoal({
      currentWeightKg,
      targetChangeKg: targetKg,
      weeks,
      direction,
      velocity,
      tdee,
      prescribedDeltaPct,
      trainsRegularly,
      proteinAdequate,
      capacity,
    });
  }, [
    targetKg,
    weeks,
    currentWeightKg,
    direction,
    velocity,
    tdee,
    prescribedDeltaPct,
    trainsRegularly,
    proteinAdequate,
    capacity,
  ]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Definição Estratégica"
        description="Quanto e em quanto tempo — e o quão realista isso é, antes de qualquer promessa."
      />

      <Card className="border-l-2 border-l-gold">
        <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-target" className="text-xs">
              Quanto {verb(direction)} (kg)
            </Label>
            <Input
              id="goal-target"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0}
              placeholder="Ex.: 8"
              value={targetKg ?? ""}
              onChange={(e) => update(e.target.value === "" ? null : Number(e.target.value), weeks)}
              className="h-9 w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-weeks" className="text-xs">
              Em quantas semanas
            </Label>
            <Input
              id="goal-weeks"
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              placeholder="Ex.: 16"
              value={weeks ?? ""}
              onChange={(e) =>
                update(targetKg, e.target.value === "" ? null : Math.round(Number(e.target.value)))
              }
              className="h-9 w-32"
            />
          </div>
          {projection ? (
            <div className="flex flex-1 items-center justify-start pb-1 sm:justify-end">
              <Badge variant={REALISM_BADGE[projection.realism.level].variant} className="text-sm">
                {REALISM_BADGE[projection.realism.level].label}
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!projection ? (
        <p className="text-sm text-muted-foreground">
          Informe a meta e o prazo para o sistema projetar o realismo, a perda de massa magra
          estimada e a aderência provável.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Ritmo semanal"
              value={`${projection.weeklyRateKg} kg`}
              delta={`${Math.round(projection.weeklyRatePctBW * 100)}% do peso/semana`}
              icon={<ScaleIcon />}
            />
            <MetricCard
              label={direction === "deficit" ? "Déficit diário" : "Superávit diário"}
              value={`${projection.dailyEnergyDeltaKcal} kcal`}
              delta={`${Math.round(projection.requiredDeltaPctTdee * 100)}% do gasto`}
              icon={<GaugeIcon />}
            />
            {projection.muscle ? (
              <MetricCard
                label="Massa magra em risco"
                value={`~${projection.muscle.estimatedLeanLossKg} kg`}
                delta={`${projection.muscle.leanFractionPct}% da perda`}
                icon={<HeartPulseIcon />}
              />
            ) : null}
            <MetricCard
              label="Aderência provável"
              value={`${projection.adherence.score}/100`}
              delta={
                projection.adherence.level === "alta"
                  ? "Alta"
                  : projection.adherence.level === "media"
                    ? "Média"
                    : "Baixa"
              }
              icon={<TrendingUpIcon />}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <InsightCard
              kind={projection.realism.level === "tranquilo" ? "opportunity" : "risk"}
              title={REALISM_BADGE[projection.realism.level].label}
              description={projection.realism.reason}
            />
            <InsightCard
              kind="recommendation"
              title={`Aderência estimada: ${projection.adherence.score}/100`}
              description={projection.adherence.reason}
            />
            {projection.muscle ? (
              <InsightCard
                kind={projection.muscle.leanFractionPct >= 25 ? "risk" : "opportunity"}
                title={`Massa magra: ~${projection.muscle.estimatedLeanLossKg} kg (${projection.muscle.leanFractionPct}% da perda)`}
                description={projection.muscle.note}
              />
            ) : null}
          </div>

          {projection.risks.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Riscos a gerenciar
              </span>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {projection.risks.map((risk) => (
                  <InsightCard key={risk} kind="risk" title="Atenção" description={risk} />
                ))}
              </div>
            </div>
          ) : null}

          {projection.suggestion ? (
            <Card className="border-l-2 border-l-gold">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <WandSparklesIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Prazo realista sugerido</span>
                    <span className="text-sm text-muted-foreground">
                      {projection.suggestion.reason}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => update(targetKg, projection.suggestion!.weeks)}
                >
                  Aplicar {projection.suggestion.weeks} semanas
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </section>
  );
}
