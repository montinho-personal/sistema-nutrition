"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { setMealPlanInstruction } from "@/modules/meal-plan/services/mealPlanRepository";
import type { MealPlanPref } from "@/modules/meal-plan/types";

const EMPTY: MealPlanPref[] = [];

/**
 * Instrução do treinador em linguagem natural, reativa e persistida por aluno
 * (Personal Nutrition AI — Fatia A). Alimenta a cadeia do cardápio: ao gravar,
 * a store notifica e o plano se remonta com a intenção aplicada.
 */
export function useMealPlanInstruction(studentId: string) {
  const prefs = useLocalCollection<MealPlanPref[]>("meal_plan_prefs", EMPTY);
  const instruction = React.useMemo(
    () => prefs.find((p) => p.studentId === studentId)?.instruction ?? "",
    [prefs, studentId],
  );

  const setInstruction = React.useCallback(
    (text: string) => setMealPlanInstruction(studentId, text.trim() ? text : null),
    [studentId],
  );

  return { instruction, setInstruction };
}
