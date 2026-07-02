/**
 * Motores de busca, filtro e recomendação (Documento 15).
 *
 * Predicados puros e combináveis. A busca por texto normaliza acentos
 * para tolerância. A recomendação é um ranqueamento determinístico por
 * aderência ao objetivo e às restrições — nunca IA (Documento 08).
 */

import { COST_ORDER } from "@/modules/foods/constants";
import type { Food, FoodFilterCriteria, FoodGoal } from "@/modules/foods/types";

/** Remove acentos e normaliza para busca tolerante. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Verdadeiro se o alimento casa com o termo de busca (nome ou sinônimos). */
export function matchesQuery(food: Food, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = [food.name, ...(food.synonyms ?? []), food.categoryName ?? ""]
    .map(normalize)
    .join(" ");
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

/** Aplica todos os critérios de filtro a um alimento (predicado puro). */
export function matchesCriteria(food: Food, criteria: FoodFilterCriteria): boolean {
  const { nutrition, attributes } = food;

  if (criteria.query && !matchesQuery(food, criteria.query)) return false;
  if (criteria.categoryName && food.categoryName !== criteria.categoryName) return false;
  if (criteria.goal && !attributes.suitableGoals.includes(criteria.goal)) return false;
  if (criteria.timing && !attributes.bestTimes.includes(criteria.timing)) return false;

  if (criteria.tags && criteria.tags.length > 0) {
    const names = new Set(food.tags.map((t) => t.name));
    if (!criteria.tags.every((tag) => names.has(tag))) return false;
  }

  if (
    criteria.maxPrepMinutes !== undefined &&
    (attributes.prepTimeMinutes ?? Infinity) > criteria.maxPrepMinutes
  ) {
    return false;
  }

  if (criteria.maxCost !== undefined) {
    const cost = attributes.costRange;
    if (cost === null || COST_ORDER[cost] > COST_ORDER[criteria.maxCost]) return false;
  }

  if (criteria.minProteinG !== undefined && (nutrition.proteinG ?? 0) < criteria.minProteinG) {
    return false;
  }
  if (criteria.minFiberG !== undefined && (nutrition.fiberG ?? 0) < criteria.minFiberG) {
    return false;
  }
  if (
    criteria.maxEnergyKcal !== undefined &&
    (nutrition.energyKcal ?? Infinity) > criteria.maxEnergyKcal
  ) {
    return false;
  }
  if (
    criteria.minSatietyScore !== undefined &&
    (attributes.satietyScore ?? 0) < criteria.minSatietyScore
  ) {
    return false;
  }

  if (criteria.onlyPortable && !attributes.portability) return false;
  if (criteria.onlyLunchbox && !attributes.goodForLunchbox) return false;
  if (criteria.onlyFreezable && !attributes.freezesWell) return false;

  return true;
}

/** Filtra uma lista de alimentos pelos critérios. */
export function filterFoods(foods: Food[], criteria: FoodFilterCriteria): Food[] {
  return foods.filter((food) => matchesCriteria(food, criteria));
}

/**
 * Pontua a aderência de um alimento a um objetivo (0–100), combinando
 * indicação explícita, saciedade e densidade proteica. Determinístico.
 */
export function goalFitScore(food: Food, goal: FoodGoal): number {
  let score = 0;
  if (food.attributes.suitableGoals.includes(goal)) score += 50;
  score += (food.attributes.satietyScore ?? 0) * 0.3;
  const protein = food.nutrition.proteinG ?? 0;
  score += Math.min(protein, 30) * (goal === "hypertrophy" ? 0.8 : 0.4);
  return Math.round(Math.min(100, score));
}

/**
 * Recomenda alimentos para um objetivo, respeitando filtros, ordenados
 * pela aderência. Base determinística que o NDE poderá consumir depois.
 */
export function recommendFoods(
  foods: Food[],
  goal: FoodGoal,
  criteria: FoodFilterCriteria = {},
  limit = 10,
): Food[] {
  return filterFoods(foods, { ...criteria, goal })
    .map((food) => ({ food, score: goalFitScore(food, goal) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.food);
}
