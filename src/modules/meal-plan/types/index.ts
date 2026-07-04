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

/** Preferência persistida (local-first): variante e instrução do treinador. */
export interface MealPlanPref {
  studentId: string;
  variant: number;
  /** Instrução em linguagem natural do treinador ("1700 kcal, sem carbo à noite"). */
  instruction?: string | null;
  /**
   * Interpretação já aplicada da instrução (determinística ou enriquecida pela
   * IA). Persistir evita reinterpretar — e chamar a IA — a cada carregamento.
   */
  directive?: MealPlanDirective | null;
  updatedAt: string;
}

/**
 * Restrições estruturadas extraídas de uma instrução em linguagem natural do
 * treinador (Personal Nutrition AI — Fatia A). O motor determinístico é a base;
 * a instrução apenas ajusta o contexto — nunca reescreve a estratégia.
 */
export interface MealPlanDirective {
  /** Sobrescreve as calorias-alvo do cardápio (ex.: "1700 kcal"). */
  caloriesOverride: number | null;
  /** Sobrescreve o número de refeições (ex.: "5 refeições"). */
  mealsPerDay: number | null;
  /** "Dieta barata" — prioriza alimentos de menor custo. */
  budgetTight: boolean;
  /** "Refeições rápidas" — prioriza praticidade. */
  emphasizePracticality: boolean;
  /** "Mais saciedade" — prioriza alimentos saciantes. */
  emphasizeSatiety: boolean;
  /** "Zero carboidrato à noite" — jantar/ceia sem carbo (gordura fecha a energia). */
  noCarbAtNight: boolean;
  /** Restrições adicionadas pela instrução (ex.: "sem lactose"). */
  addRestrictions: string[];
  /**
   * Alimentos pedidos por refeição (nomes livres). Ex.: "Café: aveia, whey e
   * pasta de amendoim" → { breakfast: ["aveia","whey","pasta de amendoim"] }. A
   * refeição é montada exatamente com esses alimentos (o motor resolve os nomes).
   */
  mealFoods: Partial<Record<MealSlot, string[]>>;
  /** Frases reconhecidas, para transparência na interface. */
  recognized: string[];
  /**
   * Intenções que a IA entendeu mas o sistema ainda não sabe honrar (ex.: "sem
   * amendoim", "mais proteína no café"). Nunca ignoradas em silêncio — a
   * interface mostra o que não foi aplicado (honestidade — Documento 02).
   */
  unsupported: string[];
}
