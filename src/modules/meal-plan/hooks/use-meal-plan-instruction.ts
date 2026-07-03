"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { setMealPlanInstruction } from "@/modules/meal-plan/services/mealPlanRepository";
import type { MealPlanDirective, MealPlanPref } from "@/modules/meal-plan/types";

const EMPTY: MealPlanPref[] = [];

/**
 * Instrução do treinador em linguagem natural e sua interpretação já aplicada,
 * reativas e persistidas por aluno (Personal Nutrition AI — Fatia A). Alimenta a
 * cadeia do cardápio: ao gravar, a store notifica e o plano se remonta. A
 * diretiva persistida evita reinterpretar — e chamar a IA — a cada carregamento.
 */
export function useMealPlanInstruction(studentId: string) {
  const prefs = useLocalCollection<MealPlanPref[]>("meal_plan_prefs", EMPTY);
  const pref = React.useMemo(
    () => prefs.find((p) => p.studentId === studentId) ?? null,
    [prefs, studentId],
  );

  const setInstruction = React.useCallback(
    (text: string, directive: MealPlanDirective | null) =>
      setMealPlanInstruction(studentId, text.trim() ? text : null, text.trim() ? directive : null),
    [studentId],
  );

  return {
    instruction: pref?.instruction ?? "",
    storedDirective: pref?.directive ?? null,
    setInstruction,
  };
}
