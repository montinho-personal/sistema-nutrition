/**
 * Persistência do Plano Alimentar — local-first. O cardápio é derivado
 * deterministicamente; persistimos apenas a variante escolhida pelo treinador
 * (Documento 17 — evoluir, nunca duplicar estado).
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { MealPlanPref } from "@/modules/meal-plan/types";

const STORAGE_KEY = "meal_plan_prefs";

function readAll(): MealPlanPref[] {
  return readLocal<MealPlanPref[]>(STORAGE_KEY, []);
}

function persist(prefs: MealPlanPref[]): void {
  writeLocal(STORAGE_KEY, prefs);
}

/** Variante escolhida de um aluno (0 por padrão). */
export function getMealPlanVariant(studentId: string): number {
  return readAll().find((p) => p.studentId === studentId)?.variant ?? 0;
}

/** Grava a variante escolhida (upsert). */
export function setMealPlanVariant(studentId: string, variant: number): void {
  const all = readAll();
  const index = all.findIndex((p) => p.studentId === studentId);
  const pref: MealPlanPref = { studentId, variant, updatedAt: new Date().toISOString() };
  if (index === -1) persist([pref, ...all]);
  else {
    all[index] = pref;
    persist(all);
  }
}
