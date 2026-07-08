"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { MealPlanEdits, MealPlanPref } from "@/modules/meal-plan/types";

const EMPTY: MealPlanPref[] = [];

/**
 * Edições manuais do cardápio de um aluno, reativas e persistidas (salvamento
 * automático). Ao gravar uma edição no repositório, a store notifica e o plano
 * editado se remonta em TODAS as telas (quadro, Parecer, Documento, Relatório).
 */
export function useMealPlanEdits(studentId: string): MealPlanEdits | null {
  const prefs = useLocalCollection<MealPlanPref[]>("meal_plan_prefs", EMPTY);
  return React.useMemo(
    () => prefs.find((p) => p.studentId === studentId)?.edits ?? null,
    [prefs, studentId],
  );
}
