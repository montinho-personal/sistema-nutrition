"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  PencilIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { StudentGoal } from "@/modules/students/types";
import type { ScoreKey } from "@/modules/diagnosis/types";
import { AnthropometricsForm } from "@/modules/strategy/components/anthropometrics-form";
import { MacroSummary } from "@/modules/strategy/components/macro-summary";
import { MacroOverrideForm } from "@/modules/strategy/components/macro-override-form";
import { GoalDefinition } from "@/modules/strategy/components/goal-definition";
import type { StrategyAlert } from "@/modules/strategy/services";
import type {
  MacroOverride,
  MacroParams,
  MacroTargets,
  NutritionStrategy,
  StrategyInput,
} from "@/modules/strategy/types";

/** Divisão percentual dos macros a partir dos alvos atuais (soma exata = 100). */
function overrideFromMacros(macros: MacroTargets): MacroOverride {
  const total = macros.proteinKcal + macros.carbKcal + macros.fatKcal || 1;
  const proteinPct = Math.round((macros.proteinKcal / total) * 100);
  const fatPct = Math.round((macros.fatKcal / total) * 100);
  return {
    calories: macros.calories,
    proteinPct,
    fatPct,
    carbPct: Math.max(0, 100 - proteinPct - fatPct),
  };
}

interface StrategyMacrosSectionProps {
  goal: StudentGoal;
  strategy: NutritionStrategy;
  scores: Record<ScoreKey, number>;
  input: StrategyInput | null;
  macros: MacroTargets | null;
  macroParams: MacroParams;
  alerts: StrategyAlert[];
  trainsRegularly: boolean;
  mealPlanHref: string;
  onSaveAnthropometrics: (values: StrategyInput) => void;
  onPersistGoal: (targetChangeKg: number | null, targetWeeks: number | null) => void;
  onApplyOverride: (override: MacroOverride) => void;
  onClearOverride: () => void;
}

/**
 * Bloco editável da estratégia: peso, ajuste manual de macros, resumo dos macros
 * com alertas e a Definição Estratégica (meta). Reaproveitado pela tela da
 * Estratégia e pela Etapa 3 do fluxo — a mesma edição, os mesmos recálculos.
 */
export function StrategyMacrosSection({
  goal,
  strategy,
  scores,
  input,
  macros,
  macroParams,
  alerts,
  trainsRegularly,
  mealPlanHref,
  onSaveAnthropometrics,
  onPersistGoal,
  onApplyOverride,
  onClearOverride,
}: StrategyMacrosSectionProps) {
  const [editing, setEditing] = React.useState(false);
  const [editingMacros, setEditingMacros] = React.useState(false);

  if (!input || editing) {
    return (
      <AnthropometricsForm
        initial={input}
        onSubmit={(values) => {
          onSaveAnthropometrics(values);
          setEditing(false);
        }}
        submitLabel={input ? "Recalcular macros" : "Calcular macros"}
      />
    );
  }
  if (!macros) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {input.currentWeightKg} kg
            {input.bodyFatPct ? ` · ${input.bodyFatPct}% gordura` : ""}
            {` · objetivo: ${STUDENT_GOAL_LABELS[goal]}`}
          </Badge>
          {macros.manual ? (
            <Badge className="bg-gold text-gold-foreground hover:bg-gold">
              <SlidersHorizontalIcon className="size-3" />
              Ajuste manual
            </Badge>
          ) : input.targetChangeKg && input.targetWeeks && strategy.direction !== "manutencao" ? (
            <Badge variant="secondary">
              <TargetIcon className="size-3" />
              Calorias pela meta
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon className="size-4" />
            Ajustar peso
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditingMacros((v) => !v)}>
            <SlidersHorizontalIcon className="size-4" />
            Ajustar macros
          </Button>
          {macros.manual ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClearOverride();
                setEditingMacros(false);
              }}
            >
              <RotateCcwIcon className="size-4" />
              Voltar ao automático
            </Button>
          ) : null}
          <Button asChild size="sm">
            <Link href={mealPlanHref}>
              <UtensilsIcon className="size-4" />
              Ver plano alimentar
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {editingMacros ? (
        <MacroOverrideForm
          initial={overrideFromMacros(macros)}
          onSubmit={(override) => {
            onApplyOverride(override);
            setEditingMacros(false);
          }}
          onCancel={() => setEditingMacros(false)}
        />
      ) : null}

      <MacroSummary macros={macros} alerts={alerts} />

      {strategy.direction !== "manutencao" ? (
        <GoalDefinition
          direction={strategy.direction}
          velocity={strategy.velocity}
          tdee={macros.tdee}
          currentWeightKg={input.currentWeightKg}
          capacity={scores.adherence + scores.consistency - scores.abandonmentRisk}
          prescribedDeltaPct={
            strategy.direction === "deficit"
              ? macroParams.velocityDeficitPct[strategy.velocity]
              : macroParams.velocitySurplusPct[strategy.velocity]
          }
          trainsRegularly={trainsRegularly}
          proteinAdequate={macroParams.proteinGPerKg[goal] >= 1.6}
          initialTargetKg={input.targetChangeKg ?? null}
          initialWeeks={input.targetWeeks ?? null}
          drivesPlan={!macros.manual}
          onPersist={onPersistGoal}
        />
      ) : null}
    </div>
  );
}
