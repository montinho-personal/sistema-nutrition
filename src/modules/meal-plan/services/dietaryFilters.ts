/**
 * Filtros de restrição alimentar (Documento 03B — respostas da anamnese).
 *
 * Traduz as restrições declaradas no diagnóstico (`restrictions`) em um
 * predicado puro sobre o Banco de Alimentos. Determinístico e explicável.
 */

import type { Food } from "@/modules/foods/types";

const ANIMAL_MEAT_GROUPS = new Set(["Carnes", "Pescados"]);
const ANIMAL_ALL_GROUPS = new Set(["Carnes", "Pescados", "Ovos", "Laticínios"]);

function hasTag(food: Food, name: string): boolean {
  return food.tags.some((t) => t.name === name);
}

function containsGluten(food: Food): boolean {
  // Sem uma flag de glúten no dado, usamos o grupo + nome: trigo/pão.
  return /p[ãa]o|trigo|macarr[ãa]o|farinha de trigo/i.test(food.name);
}

/**
 * Constrói um predicado que mantém apenas os alimentos permitidos pelas
 * restrições do aluno. `restrictions` vem de `answers.restrictions` (multi).
 */
export function buildDietaryFilter(restrictions: string[]): (food: Food) => boolean {
  const set = new Set(restrictions);

  return (food: Food): boolean => {
    const group = food.foodGroup ?? "";

    if (set.has("vegano") && ANIMAL_ALL_GROUPS.has(group)) return false;
    if (set.has("vegetariano") && ANIMAL_MEAT_GROUPS.has(group)) return false;

    if (set.has("sem_lactose") && group === "Laticínios" && !hasTag(food, "Sem lactose")) {
      return false;
    }
    if (set.has("sem_gluten") && containsGluten(food)) return false;

    return true;
  };
}

/** Rótulos pt-BR das restrições (para as justificativas). */
export const RESTRICTION_LABELS: Record<string, string> = {
  vegetariano: "vegetariano",
  vegano: "vegano",
  sem_lactose: "sem lactose",
  sem_gluten: "sem glúten",
  outra: "outra restrição",
};
