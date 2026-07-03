/**
 * Persistência do Plano Alimentar — local-first. O cardápio é derivado
 * deterministicamente; persistimos apenas as escolhas do treinador: a variante e
 * a instrução em linguagem natural (Documento 17 — evoluir, nunca duplicar).
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { MealPlanDirective, MealPlanPref } from "@/modules/meal-plan/types";

const STORAGE_KEY = "meal_plan_prefs";

function readAll(): MealPlanPref[] {
  return readLocal<MealPlanPref[]>(STORAGE_KEY, []);
}

function persist(prefs: MealPlanPref[]): void {
  writeLocal(STORAGE_KEY, prefs);
}

/**
 * Upsert que preserva os demais campos (variante e instrução coexistem). Sempre
 * grava um novo array — nunca mutar o em cache (a comparação por referência do
 * useSyncExternalStore não dispara re-render se mutar in-place).
 */
function upsert(studentId: string, patch: Partial<MealPlanPref>): void {
  const all = readAll();
  const index = all.findIndex((p) => p.studentId === studentId);
  const base: MealPlanPref =
    index === -1 ? { studentId, variant: 0, instruction: null, updatedAt: "" } : all[index];
  const pref: MealPlanPref = { ...base, ...patch, updatedAt: new Date().toISOString() };
  if (index === -1) persist([pref, ...all]);
  else persist(all.map((p, i) => (i === index ? pref : p)));
}

/** Variante escolhida de um aluno (0 por padrão). */
export function getMealPlanVariant(studentId: string): number {
  return readAll().find((p) => p.studentId === studentId)?.variant ?? 0;
}

/** Grava a variante escolhida (upsert, preservando a instrução). */
export function setMealPlanVariant(studentId: string, variant: number): void {
  upsert(studentId, { variant });
}

/** Instrução em linguagem natural do treinador (ou null). */
export function getMealPlanInstruction(studentId: string): string | null {
  return readAll().find((p) => p.studentId === studentId)?.instruction ?? null;
}

/** Interpretação já aplicada da instrução (ou null). */
export function getMealPlanDirective(studentId: string): MealPlanDirective | null {
  return readAll().find((p) => p.studentId === studentId)?.directive ?? null;
}

/**
 * Grava a instrução do treinador e sua interpretação (upsert, preservando a
 * variante). Persistir a diretiva evita reinterpretar — e chamar a IA — a cada
 * carregamento.
 */
export function setMealPlanInstruction(
  studentId: string,
  instruction: string | null,
  directive: MealPlanDirective | null,
): void {
  upsert(studentId, { instruction, directive });
}
