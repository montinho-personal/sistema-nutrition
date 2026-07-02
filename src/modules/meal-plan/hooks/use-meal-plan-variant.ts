"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { setMealPlanVariant } from "@/modules/meal-plan/services/mealPlanRepository";
import type { MealPlanPref } from "@/modules/meal-plan/types";

const EMPTY: MealPlanPref[] = [];

/**
 * Variante reativa do plano de um aluno. "Gerar outra opção" incrementa a
 * variante — determinístico, sem aleatoriedade (Documento 08).
 */
export function useMealPlanVariant(studentId: string) {
  const prefs = useLocalCollection<MealPlanPref[]>("meal_plan_prefs", EMPTY);
  const variant = React.useMemo(
    () => prefs.find((p) => p.studentId === studentId)?.variant ?? 0,
    [prefs, studentId],
  );

  const next = React.useCallback(
    () => setMealPlanVariant(studentId, variant + 1),
    [studentId, variant],
  );

  return { variant, next };
}
