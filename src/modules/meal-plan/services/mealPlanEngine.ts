/**
 * Motor do Plano Alimentar (Documento 00 — a dieta é consequência da
 * estratégia; Documento 08 — regra, não IA).
 *
 * Recebe os macros (da Estratégia) e o Banco de Alimentos e monta o cardápio:
 * distribui as calorias nas N refeições, escolhe alimentos por papel (respeitando
 * restrições, orçamento, praticidade e saciedade) e calcula as gramas para bater
 * o alvo de cada refeição. Tudo determinístico e auditável.
 */

import { COST_ORDER } from "@/modules/foods/constants";
import { goalFitScore } from "@/modules/foods/services";
import type { Food, FoodGoal, MealTiming } from "@/modules/foods/types";
import type { StudentGoal } from "@/modules/students/types";
import {
  GRAMS_ROUNDING,
  MEAL_TEMPLATES,
  PORTION_LIMITS,
  RANK_WEIGHTS,
  ROLE_THRESHOLDS,
  VEG_FIXED_GRAMS,
  type MealTemplate,
} from "@/modules/meal-plan/constants/parameters";
import {
  buildDietaryFilter,
  RESTRICTION_LABELS,
} from "@/modules/meal-plan/services/dietaryFilters";
import type {
  FoodRole,
  MacroTotals,
  MealItem,
  MealPlan,
  PlannedMeal,
} from "@/modules/meal-plan/types";

/** Contexto de montagem, derivado da Estratégia + Diagnóstico. */
export interface MealPlanContext {
  goal: StudentGoal;
  mealsPerDay: number;
  /** Alvo diário: kcal + gramas de cada macro. */
  macros: MacroTotals;
  emphasizeSatiety: boolean;
  emphasizePracticality: boolean;
  budgetTight: boolean;
  restrictions: string[];
  variant: number;
}

/** Objetivo do aluno → objetivo do Banco de Alimentos (que tem menos opções). */
const GOAL_TO_FOOD_GOAL: Record<StudentGoal, FoodGoal> = {
  weight_loss: "weight_loss",
  event_preparation: "weight_loss",
  hypertrophy: "hypertrophy",
  recomposition: "recomposition",
  maintenance: "maintenance",
  health: "maintenance",
  performance: "performance",
};

const EMPTY_MACROS: MacroTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

function round(value: number, step = 1): number {
  return Math.round(value / step) * step;
}

/** Papel do alimento por dominância de macro (Documento 08 — regra). */
export function classifyRole(food: Food): FoodRole {
  const kcal = food.nutrition.energyKcal ?? 0;
  if (kcal > 0 && kcal <= ROLE_THRESHOLDS.vegMaxKcalPer100g) return "veg";
  if (kcal <= 0) return "veg";

  const proteinShare = ((food.nutrition.proteinG ?? 0) * 4) / kcal;
  const fatShare = ((food.nutrition.fatG ?? 0) * 9) / kcal;
  if (proteinShare >= ROLE_THRESHOLDS.proteinShare) return "protein";
  if (fatShare >= ROLE_THRESHOLDS.fatShare) return "fat";
  return "carb";
}

/** Macros de uma porção (g) de um alimento. */
function scaleFood(food: Food, grams: number): MacroTotals {
  const f = grams / 100;
  return {
    kcal: (food.nutrition.energyKcal ?? 0) * f,
    protein: (food.nutrition.proteinG ?? 0) * f,
    carbs: (food.nutrition.carbsG ?? 0) * f,
    fat: (food.nutrition.fatG ?? 0) * f,
  };
}

function addMacros(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

/** Ranqueamento determinístico de um alimento para um papel/timing. */
function rankScore(food: Food, timing: MealTiming, ctx: MealPlanContext): number {
  let score = goalFitScore(food, GOAL_TO_FOOD_GOAL[ctx.goal]);
  if (food.attributes.bestTimes.includes(timing)) score += RANK_WEIGHTS.timingMatch;
  if (ctx.emphasizeSatiety) score += (food.attributes.satietyScore ?? 0) * RANK_WEIGHTS.satietyEmphasis;
  if (ctx.emphasizePracticality) {
    score += (food.attributes.practicalityScore ?? 0) * RANK_WEIGHTS.practicalityEmphasis;
  }
  if (ctx.budgetTight && food.attributes.costRange) {
    score -= COST_ORDER[food.attributes.costRange] * RANK_WEIGHTS.budgetPenaltyPerLevel;
  }
  return score;
}

/** Candidatos de um papel, filtrados por restrição e ordenados por aderência. */
function candidatesForRole(
  foods: Food[],
  role: FoodRole,
  timing: MealTiming,
  ctx: MealPlanContext,
): Food[] {
  const allowed = buildDietaryFilter(ctx.restrictions);
  return foods
    .filter(allowed)
    .filter((f) => classifyRole(f) === role)
    .map((f) => ({ f, s: rankScore(f, timing, ctx) }))
    .sort((a, b) => b.s - a.s || a.f.id.localeCompare(b.f.id))
    .map((e) => e.f);
}

/** Escolhe um alimento respeitando a variante e evitando repetição. */
function pick(
  candidates: Food[],
  offset: number,
  usedMeal: Set<string>,
  usedDay: Set<string>,
): Food | null {
  if (candidates.length === 0) return null;
  const n = candidates.length;
  const ordered = Array.from({ length: n }, (_, i) => candidates[(offset + i) % n]);
  return (
    ordered.find((f) => !usedMeal.has(f.id) && !usedDay.has(f.id)) ??
    ordered.find((f) => !usedMeal.has(f.id)) ??
    ordered[0]
  );
}

/** Gramas para atingir um alvo de macro, dentro da faixa do papel. */
function solveGrams(food: Food, role: FoodRole, targetMacroG: number): number {
  const per100 =
    role === "protein"
      ? food.nutrition.proteinG ?? 0
      : role === "fat"
        ? food.nutrition.fatG ?? 0
        : food.nutrition.carbsG ?? 0;
  const limits = PORTION_LIMITS[role];
  if (per100 <= 0) return limits.min;
  const grams = (Math.max(0, targetMacroG) * 100) / per100;
  return Math.min(limits.max, Math.max(limits.min, round(grams, GRAMS_ROUNDING)));
}

function portionLabel(food: Food, grams: number): string | null {
  const portion = food.portions[0];
  if (!portion || portion.grams <= 0) return null;
  const count = round(grams / portion.grams, 0.5);
  if (count <= 0) return null;
  const countLabel = Number.isInteger(count) ? String(count) : count.toFixed(1).replace(".", ",");
  return `≈ ${countLabel} ${portion.name}`;
}

function toItem(food: Food, role: FoodRole, grams: number): MealItem {
  const m = scaleFood(food, grams);
  return {
    foodId: food.id,
    foodName: food.name,
    role,
    grams,
    portionLabel: portionLabel(food, grams),
    kcal: round(m.kcal),
    protein: round(m.protein),
    carbs: round(m.carbs),
    fat: round(m.fat),
  };
}

/** Monta uma refeição: escolhe os alimentos e resolve as porções. */
function buildMeal(
  template: MealTemplate,
  target: MacroTotals,
  foods: Food[],
  ctx: MealPlanContext,
  usedDay: Set<string>,
): PlannedMeal {
  const usedMeal = new Set<string>();
  const selected = new Map<FoodRole, Food>();

  for (const role of template.roles) {
    const candidates = candidatesForRole(foods, role, template.timing, ctx);
    const food = pick(candidates, ctx.variant, usedMeal, usedDay);
    if (food) {
      selected.set(role, food);
      usedMeal.add(food.id);
      usedDay.add(food.id);
    }
  }

  // Resolve as porções em ordem de prioridade: vegetal (fixo) → proteína →
  // gordura → carboidrato (absorve o restante das calorias).
  const remaining: MacroTotals = { ...target };
  const items: MealItem[] = [];
  const order: FoodRole[] = ["veg", "protein", "fat", "carb"];

  for (const role of order) {
    const food = selected.get(role);
    if (!food) continue;
    const grams =
      role === "veg"
        ? VEG_FIXED_GRAMS
        : solveGrams(food, role, role === "carb" ? remaining.carbs : role === "fat" ? remaining.fat : remaining.protein);
    const item = toItem(food, role, grams);
    items.push(item);
    remaining.protein -= item.protein;
    remaining.carbs -= item.carbs;
    remaining.fat -= item.fat;
  }

  // Reordena os itens conforme o template (proteína primeiro na exibição).
  items.sort((a, b) => template.roles.indexOf(a.role) - template.roles.indexOf(b.role));

  const totals = items.reduce(
    (acc, i) => addMacros(acc, { kcal: i.kcal, protein: i.protein, carbs: i.carbs, fat: i.fat }),
    { ...EMPTY_MACROS },
  );

  return {
    slot: template.slot,
    title: template.title,
    timing: template.timing,
    target: {
      kcal: round(target.kcal),
      protein: round(target.protein),
      carbs: round(target.carbs),
      fat: round(target.fat),
    },
    items,
    totals: {
      kcal: round(totals.kcal),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
    },
  };
}

function pct(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((value / target) * 100);
}

function buildNotes(ctx: MealPlanContext, accuracy: MacroTotals): string[] {
  const notes: string[] = [
    `Cardápio distribuído em ${ctx.mealsPerDay} refeições, conforme a estratégia.`,
  ];
  if (ctx.emphasizeSatiety)
    notes.push("Seleção priorizou alimentos saciantes (controle de fome baixo).");
  if (ctx.emphasizePracticality)
    notes.push("Seleção priorizou praticidade (rotina corrida).");
  if (ctx.budgetTight) notes.push("Preferência por alimentos de menor custo.");

  const applied = ctx.restrictions
    .filter((r) => r !== "nenhuma" && RESTRICTION_LABELS[r])
    .map((r) => RESTRICTION_LABELS[r]);
  if (applied.length) notes.push(`Restrições respeitadas: ${applied.join(", ")}.`);

  notes.push(
    `Fechamento: ${accuracy.kcal}% das calorias e ${accuracy.protein}% da proteína do alvo.`,
  );
  return notes;
}

/**
 * Monta o Plano Alimentar completo do dia a partir do contexto e do Banco de
 * Alimentos. Determinístico: mesmo contexto + mesma variante = mesmo cardápio.
 */
export function buildMealPlan(foods: Food[], ctx: MealPlanContext): MealPlan {
  const template = MEAL_TEMPLATES[ctx.mealsPerDay] ?? MEAL_TEMPLATES[4];
  const usedDay = new Set<string>();

  const meals = template.map((meal) => {
    const target: MacroTotals = {
      kcal: ctx.macros.kcal * meal.kcalFraction,
      protein: ctx.macros.protein * meal.kcalFraction,
      carbs: ctx.macros.carbs * meal.kcalFraction,
      fat: ctx.macros.fat * meal.kcalFraction,
    };
    return buildMeal(meal, target, foods, ctx, usedDay);
  });

  const totals = meals.reduce((acc, m) => addMacros(acc, m.totals), { ...EMPTY_MACROS });
  const target: MacroTotals = {
    kcal: round(ctx.macros.kcal),
    protein: round(ctx.macros.protein),
    carbs: round(ctx.macros.carbs),
    fat: round(ctx.macros.fat),
  };
  const accuracy: MacroTotals = {
    kcal: pct(totals.kcal, target.kcal),
    protein: pct(totals.protein, target.protein),
    carbs: pct(totals.carbs, target.carbs),
    fat: pct(totals.fat, target.fat),
  };

  return {
    meals,
    target,
    totals: {
      kcal: round(totals.kcal),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
    },
    accuracy,
    notes: buildNotes(ctx, accuracy),
    variant: ctx.variant,
  };
}
