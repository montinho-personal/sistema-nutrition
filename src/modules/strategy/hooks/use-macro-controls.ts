"use client";

import * as React from "react";

import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import type { DietApproachId, MacroOverride, StrategyInput } from "@/modules/strategy/types";

/**
 * Operações de edição da estratégia de um aluno (peso, meta e ajuste manual de
 * macros), reaproveitadas pela tela da Estratégia e pelo fluxo — fonte única,
 * sem duplicar a persistência.
 */
export function useMacroControls(studentId: string) {
  const { input, save } = useStrategyInput(studentId);

  const saveAnthropometrics = React.useCallback(
    (values: StrategyInput) => save({ ...input, ...values }),
    [input, save],
  );
  const persistGoal = React.useCallback(
    (targetChangeKg: number | null, targetWeeks: number | null) => {
      if (!input) return;
      save({ ...input, targetChangeKg, targetWeeks });
    },
    [input, save],
  );
  const applyOverride = React.useCallback(
    (macroOverride: MacroOverride) => {
      if (!input) return;
      save({ ...input, macroOverride });
    },
    [input, save],
  );
  const clearOverride = React.useCallback(() => {
    if (!input) return;
    save({ ...input, macroOverride: null });
  }, [input, save]);
  const setDietApproach = React.useCallback(
    (dietApproach: DietApproachId) => {
      if (!input) return;
      save({ ...input, dietApproach });
    },
    [input, save],
  );

  return { input, saveAnthropometrics, persistGoal, applyOverride, clearOverride, setDietApproach };
}
