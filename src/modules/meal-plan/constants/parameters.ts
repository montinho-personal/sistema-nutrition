/**
 * Parâmetros do Plano Alimentar (Documento 08 — nenhum número mágico).
 *
 * Distribuição das refeições, composição por slot, faixas de porção e limiares
 * de classificação vivem aqui — ponto único de verdade, ajustável no futuro
 * pela tela de Configurações.
 */

import type { MealTiming } from "@/modules/foods/types";
import type { FoodRole, MealSlot } from "@/modules/meal-plan/types";

/** Modelo de uma refeição no dia: título, timing e fração das calorias. */
export interface MealTemplate {
  slot: MealSlot;
  title: string;
  timing: MealTiming;
  /** Fração das calorias diárias (as frações de um modelo somam 1). */
  kcalFraction: number;
  /** Papéis de alimento que compõem a refeição, em ordem de resolução. */
  roles: FoodRole[];
}

/**
 * Modelos por número de refeições (Documento 04 — Etapa 5). As proteínas ficam
 * nas refeições principais; lanches priorizam praticidade e saciedade.
 */
export const MEAL_TEMPLATES: Record<number, MealTemplate[]> = {
  3: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.3, roles: ["protein", "carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.4, roles: ["protein", "carb", "veg"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.3, roles: ["protein", "carb", "veg"] },
  ],
  4: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.25, roles: ["protein", "carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.35, roles: ["protein", "carb", "veg"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.15, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.25, roles: ["protein", "carb", "veg"] },
  ],
  5: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.22, roles: ["protein", "carb", "fat"] },
    { slot: "morning_snack", title: "Lanche da manhã", timing: "snack", kcalFraction: 0.1, roles: ["carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.3, roles: ["protein", "carb", "veg"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.13, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.25, roles: ["protein", "carb", "veg"] },
  ],
  6: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.2, roles: ["protein", "carb", "fat"] },
    { slot: "morning_snack", title: "Lanche da manhã", timing: "snack", kcalFraction: 0.1, roles: ["carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.28, roles: ["protein", "carb", "veg"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.12, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.22, roles: ["protein", "carb", "veg"] },
    { slot: "supper", title: "Ceia", timing: "supper", kcalFraction: 0.08, roles: ["protein"] },
  ],
};

/** Limiares de classificação de papel (fração das calorias do alimento). */
export const ROLE_THRESHOLDS = {
  /** Abaixo desta densidade energética (kcal/100 g) → vegetal (volume/fibra). */
  vegMaxKcalPer100g: 40,
  /** Proteína domina se a fração calórica proteica ≥ isto. */
  proteinShare: 0.3,
  /** Gordura domina se a fração calórica lipídica ≥ isto. */
  fatShare: 0.45,
} as const;

/** Faixas de porção (g) por papel — evita porções absurdas. */
export const PORTION_LIMITS: Record<FoodRole, { min: number; max: number }> = {
  protein: { min: 30, max: 300 },
  carb: { min: 15, max: 380 },
  fat: { min: 5, max: 60 },
  veg: { min: 50, max: 200 },
};

/** Porção fixa dos vegetais (volume alimentar para saciedade). */
export const VEG_FIXED_GRAMS = 120;

/** Arredondamento das porções (múltiplo de gramas). */
export const GRAMS_ROUNDING = 5;

/** Pesos do ranqueamento de alimentos (base + ênfases da estratégia). */
export const RANK_WEIGHTS = {
  timingMatch: 20,
  satietyEmphasis: 0.4,
  practicalityEmphasis: 0.4,
  budgetPenaltyPerLevel: 8,
} as const;

/** Rótulos pt-BR dos papéis. */
export const ROLE_LABELS: Record<FoodRole, string> = {
  protein: "Proteína",
  carb: "Carboidrato",
  fat: "Gordura boa",
  veg: "Vegetal",
};
