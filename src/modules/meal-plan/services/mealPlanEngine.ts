/**
 * Motor do Plano Alimentar (Documento 00 — a dieta é consequência da
 * estratégia; Documento 08 — regra, não IA).
 *
 * Recebe os macros (da Estratégia) e o Banco de Alimentos e monta o cardápio:
 * distribui as calorias nas N refeições, escolhe alimentos por papel E por
 * horário — cada alimento só entra na refeição em que se come de fato (arroz e
 * feijão no almoço/jantar, aveia e pão no café, fruta e iogurte no lanche),
 * respeitando restrições, orçamento, praticidade e saciedade — e calcula as
 * gramas para bater o alvo de cada refeição. Tudo determinístico e auditável.
 */

import { COST_ORDER } from "@/modules/foods/constants";
import { goalFitScore } from "@/modules/foods/services";
import type { Food, FoodGoal, MealTiming } from "@/modules/foods/types";
import type { StudentGoal } from "@/modules/students/types";
import {
  GRAMS_ROUNDING,
  LEGUME_FIXED_GRAMS,
  MEAL_TEMPLATES,
  MEAL_TIMING_COMPATIBILITY,
  PORTION_LIMITS,
  RANK_WEIGHTS,
  ROLE_THRESHOLDS,
  SOLVER_PASSES,
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
  /** Ids dos alimentos que o aluno já come — priorizados no cardápio (aderência). */
  habitualFoodIds?: string[];
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

/** Grupo do Banco de Alimentos que reúne feijões e leguminosas. */
const LEGUME_FOOD_GROUP = "Leguminosas";

/** Papel do alimento por dominância de macro (Documento 08 — regra). */
export function classifyRole(food: Food): FoodRole {
  const kcal = food.nutrition.energyKcal ?? 0;
  if (kcal > 0 && kcal <= ROLE_THRESHOLDS.vegMaxKcalPer100g) return "veg";
  if (kcal <= 0) return "veg";

  const proteinShare = ((food.nutrition.proteinG ?? 0) * 4) / kcal;
  const fatShare = ((food.nutrition.fatG ?? 0) * 9) / kcal;
  if (proteinShare >= ROLE_THRESHOLDS.proteinShare) return "protein";
  if (fatShare >= ROLE_THRESHOLDS.fatShare) return "fat";
  // Leguminosa carbo-dominante (feijão, lentilha, grão-de-bico) é o
  // acompanhamento do arroz — papel próprio. Tofu/PTS, proteína-dominantes, já
  // saíram como "protein" acima e seguem como fonte proteica (inclusive vegana).
  if (food.foodGroup === LEGUME_FOOD_GROUP) return "legume";
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
  // Alimentos que o aluno já come vêm primeiro — o cardápio segue os hábitos.
  if (ctx.habitualFoodIds?.includes(food.id)) score += RANK_WEIGHTS.habitualBonus;
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

/**
 * Um alimento combina com um momento do dia se algum de seus melhores horários
 * pertence à refeição (café ≠ almoço ≠ lanche). É a regra que impede arroz no
 * café ou aveia no almoço — cada alimento na refeição em que se come de fato.
 */
export function isTimingAppropriate(food: Food, timing: MealTiming): boolean {
  const compatible = MEAL_TIMING_COMPATIBILITY[timing];
  return food.attributes.bestTimes.some((t) => compatible.includes(t));
}

/** Candidatos de um papel, filtrados por restrição e ordenados por aderência. */
function candidatesForRole(
  foods: Food[],
  role: FoodRole,
  timing: MealTiming,
  ctx: MealPlanContext,
): Food[] {
  const allowed = buildDietaryFilter(ctx.restrictions);
  const ofRole = foods.filter(allowed).filter((f) => classifyRole(f) === role);
  // Filtro duro de horário: só alimentos que combinam com a refeição. Se o banco
  // não tiver nenhum apto (caso raro/restrito), cai para todos do papel — a
  // coerência cede o mínimo para o prato nunca ficar vazio.
  const timely = ofRole.filter((f) => isTimingAppropriate(f, timing));
  const pool = timely.length > 0 ? timely : ofRole;
  return pool
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

/** Gramas do carboidrato para preencher as calorias restantes da refeição. */
function solveGramsForKcal(food: Food, targetKcal: number): number {
  const per100 = food.nutrition.energyKcal ?? 0;
  const limits = PORTION_LIMITS.carb;
  if (per100 <= 0) return limits.min;
  const grams = (Math.max(0, targetKcal) * 100) / per100;
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

  // Resolve as porções com um solver de resíduo iterativo (Gauss-Seidel): cada
  // alimento é ajustado para o alvo do SEU macro menos o que os outros já
  // contribuem. Assim a proteína dos cereais/gorduras é descontada da porção
  // proteica — o que elimina o overshoot do fechamento sequencial ingênuo.
  const grams = new Map<FoodRole, number>();
  if (selected.has("veg")) grams.set("veg", VEG_FIXED_GRAMS); // vegetal: volume fixo
  // Feijão/leguminosa: porção cultural fixa (≈ 1 concha); o arroz é quem escala.
  // Fica setado antes do solver para ser descontado da proteína e das calorias.
  if (selected.has("legume")) grams.set("legume", LEGUME_FIXED_GRAMS);

  // Proteína e gordura são alvos "duros" (massa magra / suporte hormonal);
  // o carboidrato é o macro flexível que fecha as CALORIAS restantes — o mesmo
  // princípio do motor de macros. A proteína é resolvida antes, descontando o
  // que os outros alimentos já contribuem; o carbo entra por último por energia.
  for (let pass = 0; pass < SOLVER_PASSES; pass++) {
    for (const role of ["protein", "fat", "carb"] as FoodRole[]) {
      const food = selected.get(role);
      if (!food) continue;

      if (role === "carb") {
        let othersKcal = 0;
        for (const [otherRole, otherFood] of selected) {
          if (otherRole === "carb") continue;
          othersKcal += scaleFood(otherFood, grams.get(otherRole) ?? 0).kcal;
        }
        grams.set("carb", solveGramsForKcal(food, target.kcal - othersKcal));
        continue;
      }

      const macroKey = role === "fat" ? "fat" : "protein";
      let others = 0;
      for (const [otherRole, otherFood] of selected) {
        if (otherRole === role) continue;
        others += scaleFood(otherFood, grams.get(otherRole) ?? 0)[macroKey];
      }
      grams.set(role, solveGrams(food, role, target[macroKey] - others));
    }
  }

  const items: MealItem[] = [];
  for (const role of ["veg", "legume", "protein", "fat", "carb"] as FoodRole[]) {
    const food = selected.get(role);
    if (!food) continue;
    items.push(toItem(food, role, grams.get(role) ?? PORTION_LIMITS[role].min));
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
  if (ctx.habitualFoodIds && ctx.habitualFoodIds.length > 0)
    notes.push(
      "Cardápio baseado no que você já come — priorizamos seus alimentos e ajustamos a proteína e o que faltava.",
    );
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

// ── Food Intelligence: troca de alimentos (Workflow V1 — Etapa 5) ─────────────

/** Soma os macros de uma lista de itens (já arredondados). */
export function sumItems(items: MealItem[]): MacroTotals {
  return items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fat: acc.fat + i.fat,
    }),
    { ...EMPTY_MACROS },
  );
}

/**
 * Constrói o item de substituição: resolve as gramas do novo alimento para
 * manter a contribuição do papel (proteína/gordura por macro, carboidrato por
 * kcal, vegetal por volume) — assim a refeição segue batendo o alvo.
 */
export function buildSwapItem(food: Food, role: FoodRole, ref: MealItem): MealItem {
  let grams: number;
  if (role === "protein") grams = solveGrams(food, "protein", ref.protein);
  else if (role === "fat") grams = solveGrams(food, "fat", ref.fat);
  else if (role === "carb") grams = solveGramsForKcal(food, ref.kcal);
  else {
    // Vegetal e leguminosa: porção de volume — mantém as gramas de referência
    // dentro da faixa do próprio papel (feijão troca por feijão/lentilha).
    const limits = PORTION_LIMITS[role];
    grams = Math.min(limits.max, Math.max(limits.min, ref.grams));
  }
  return toItem(food, role, grams);
}

/** Distribuição de macros (fração das kcal) de um alimento, para similaridade. */
function macroShare(food: Food): [number, number, number] {
  const kcal = food.nutrition.energyKcal ?? 0;
  if (kcal <= 0) return [0, 0, 0];
  return [
    ((food.nutrition.proteinG ?? 0) * 4) / kcal,
    ((food.nutrition.carbsG ?? 0) * 4) / kcal,
    ((food.nutrition.fatG ?? 0) * 9) / kcal,
  ];
}

/**
 * Equivalentes de um item: mesmos papel e restrições, ordenados por semelhança
 * nutricional (distribuição de macros próxima). Quando o horário da refeição é
 * conhecido, os equivalentes também respeitam esse momento do dia — trocar o
 * arroz do almoço oferece outros carbos de almoço, não aveia de café. Cada um já
 * traz a porção recalculada — o profissional nunca refaz a conta na mão.
 */
export function findFoodSwaps(
  item: MealItem,
  foods: Food[],
  restrictions: string[],
  timing?: MealTiming,
  limit = 6,
): { food: Food; item: MealItem }[] {
  const allowed = buildDietaryFilter(restrictions);
  const ofRole = foods
    .filter(allowed)
    .filter((f) => f.id !== item.foodId && classifyRole(f) === item.role);
  const timely = timing ? ofRole.filter((f) => isTimingAppropriate(f, timing)) : ofRole;
  const pool = timely.length > 0 ? timely : ofRole;

  const current = foods.find((f) => f.id === item.foodId);
  const ref = current ? macroShare(current) : null;
  const distance = (food: Food) => {
    if (!ref) return 0;
    const s = macroShare(food);
    return Math.hypot(s[0] - ref[0], s[1] - ref[1], s[2] - ref[2]);
  };

  return pool
    .map((f) => ({ f, d: distance(f) }))
    .sort((a, b) => a.d - b.d || a.f.id.localeCompare(b.f.id))
    .slice(0, limit)
    .map(({ f }) => ({ food: f, item: buildSwapItem(f, item.role, item) }));
}
