"use client";

import * as React from "react";

import { EmptyState } from "@/shared/components/empty-state";
import { LockIcon } from "lucide-react";
import { computeScoreMap } from "@/modules/diagnosis/services";
import { evaluateStrategyAlerts } from "@/modules/strategy/services";
import { useMacroControls } from "@/modules/strategy/hooks/use-macro-controls";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { StrategyResult } from "@/modules/strategy/components/strategy-result";
import { StrategyMacrosSection } from "@/modules/strategy/components/strategy-macros-section";
import type { FlowData } from "@/modules/flow/hooks/use-flow-data";

/**
 * Etapa 3 do fluxo — Estratégia, editável no lugar: as 12 decisões, o peso, a
 * meta e os macros ajustáveis com recálculo ao vivo e alertas inteligentes.
 * Reaproveita exatamente a mesma seção da tela da Estratégia (sem duplicar).
 */
export function FlowStrategyStep({ data, studentId }: { data: FlowData; studentId: string }) {
  const { student, session, strategy, macros } = data;
  const { input, saveAnthropometrics, persistGoal, applyOverride, clearOverride } =
    useMacroControls(studentId);
  const macroParams = useMacroParams();

  const scores = React.useMemo(
    () => (session ? computeScoreMap(session.answers) : null),
    [session],
  );
  const trainsRegularly = session?.answers.trains === "regular";
  const alerts = React.useMemo(() => {
    if (!macros || !input || !strategy) return [];
    return evaluateStrategyAlerts({
      calories: macros.calories,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      tdee: macros.tdee,
      weightKg: input.currentWeightKg,
      direction: strategy.direction,
      trainsRegularly,
    });
  }, [macros, input, strategy, trainsRegularly]);

  if (!student?.mainGoal || !strategy || !scores) {
    return (
      <EmptyState
        icon={<LockIcon />}
        title="Conclua a etapa anterior"
        description="Conclua a anamnese e defina o objetivo do aluno para montar a estratégia."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <StrategyResult strategy={strategy} />
      <StrategyMacrosSection
        goal={student.mainGoal}
        strategy={strategy}
        scores={scores}
        input={input}
        macros={macros}
        macroParams={macroParams}
        alerts={alerts}
        trainsRegularly={trainsRegularly}
        mealPlanHref={`/meal-plan/${studentId}`}
        onSaveAnthropometrics={saveAnthropometrics}
        onPersistGoal={persistGoal}
        onApplyOverride={applyOverride}
        onClearOverride={clearOverride}
      />
    </div>
  );
}
