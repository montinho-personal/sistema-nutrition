/**
 * Persistência do Plano Alimentar — local-first. O cardápio é derivado
 * deterministicamente; persistimos apenas as escolhas do treinador: a variante,
 * a instrução em linguagem natural e as edições manuais (Documento 17 —
 * evoluir, nunca duplicar).
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import { emptyEdits } from "@/modules/meal-plan/services/mealPlanEdits";
import type { MealPlanDirective, MealPlanEdits, MealPlanPref } from "@/modules/meal-plan/types";

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

/**
 * Grava a variante escolhida (upsert, preservando a instrução). "Gerar outra
 * opção" recomeça do cardápio limpo: as edições manuais são descartadas (as
 * chaves apontariam para itens de outro cardápio).
 */
export function setMealPlanVariant(studentId: string, variant: number): void {
  upsert(studentId, { variant, edits: null });
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
 * carregamento. Nova instrução recomeça do cardápio limpo (sem edições
 * manuais residuais de um cardápio que já não existe).
 */
export function setMealPlanInstruction(
  studentId: string,
  instruction: string | null,
  directive: MealPlanDirective | null,
): void {
  // A instrução redefine a base — o nº de refeições do controle também zera
  // (senão um "5 refeições" antigo do stepper venceria a instrução nova).
  upsert(studentId, { instruction, directive, edits: null, mealsPerDay: null });
}

/** Nº de refeições do controle do quadro (null = segue estratégia/instrução). */
export function getMealPlanMealsPerDay(studentId: string): number | null {
  return readAll().find((p) => p.studentId === studentId)?.mealsPerDay ?? null;
}

/**
 * Grava o nº de refeições escolhido no controle. As edições por item são
 * preservadas: as chaves são por refeição/papel, e as que ficarem órfãs numa
 * estrutura menor são ignoradas sem quebrar.
 */
export function setMealPlanMealsPerDay(studentId: string, mealsPerDay: number | null): void {
  upsert(studentId, { mealsPerDay });
}

/** Edições manuais do cardápio de um aluno (ou null, sem edições). */
export function getMealPlanEdits(studentId: string): MealPlanEdits | null {
  return readAll().find((p) => p.studentId === studentId)?.edits ?? null;
}

/** Grava as edições manuais (null descarta todas — "voltar ao original"). */
export function setMealPlanEdits(studentId: string, edits: MealPlanEdits | null): void {
  upsert(studentId, { edits });
}

/**
 * Atualiza as edições a partir do valor atual (leitura síncrona da store) com
 * uma transição pura de `mealPlanEdits.ts` — salvamento automático: cada toque
 * do treinador já vale no Relatório e no Documento.
 */
export function updateMealPlanEdits(
  studentId: string,
  mutate: (prev: MealPlanEdits) => MealPlanEdits,
): void {
  upsert(studentId, { edits: mutate(getMealPlanEdits(studentId) ?? emptyEdits()) });
}
