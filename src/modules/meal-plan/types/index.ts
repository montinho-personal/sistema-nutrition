/**
 * Tipos do Plano Alimentar (Documento 00 — a dieta é consequência da
 * estratégia). O cardápio é derivado de forma determinística da Estratégia +
 * Macros + Banco de Alimentos (Documento 08 — regra, não IA).
 */

import type { MealTiming } from "@/modules/foods/types";

/**
 * Papel de um alimento na montagem da refeição (por dominância de macro).
 * `legume` é o feijão/leguminosa-acompanhamento (carbo-dominante) — o par do
 * arroz no prato brasileiro; tofu e PTS, apesar de leguminosas, são `protein`.
 */
export type FoodRole = "protein" | "carb" | "legume" | "fat" | "veg";

/** Slots de refeição ao longo do dia. */
export type MealSlot =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "supper";

/** Totais de macronutrientes (kcal + gramas). */
export interface MacroTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Um item (alimento + porção) dentro de uma refeição. */
export interface MealItem {
  foodId: string;
  foodName: string;
  role: FoodRole;
  grams: number;
  /** Medida caseira aproximada, quando o alimento tem porção definida. */
  portionLabel: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Uma refeição planejada, com alvo e itens. */
export interface PlannedMeal {
  slot: MealSlot;
  title: string;
  timing: MealTiming;
  target: MacroTotals;
  items: MealItem[];
  totals: MacroTotals;
}

/** O plano alimentar completo do dia. */
export interface MealPlan {
  meals: PlannedMeal[];
  target: MacroTotals;
  totals: MacroTotals;
  /** % do alvo atingido por macro (100 = exato). */
  accuracy: MacroTotals;
  /** Justificativas da montagem (transparência — Documento 00). */
  notes: string[];
  variant: number;
}

/** Preferência persistida (local-first): apenas a variante escolhida. */
export interface MealPlanPref {
  studentId: string;
  variant: number;
  updatedAt: string;
}
