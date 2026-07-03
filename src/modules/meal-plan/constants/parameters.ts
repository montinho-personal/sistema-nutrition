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
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.4, roles: ["protein", "carb", "legume", "veg"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.3, roles: ["protein", "carb", "legume", "veg"] },
  ],
  4: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.25, roles: ["protein", "carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.35, roles: ["protein", "carb", "legume", "veg"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.15, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.25, roles: ["protein", "carb", "legume", "veg"] },
  ],
  5: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.22, roles: ["protein", "carb", "fat"] },
    { slot: "morning_snack", title: "Lanche da manhã", timing: "snack", kcalFraction: 0.1, roles: ["carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.3, roles: ["protein", "carb", "legume", "veg"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.13, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.25, roles: ["protein", "carb", "legume", "veg"] },
  ],
  6: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.2, roles: ["protein", "carb", "fat"] },
    { slot: "morning_snack", title: "Lanche da manhã", timing: "snack", kcalFraction: 0.1, roles: ["carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.28, roles: ["protein", "carb", "legume", "veg"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.12, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.22, roles: ["protein", "carb", "legume", "veg"] },
    { slot: "supper", title: "Ceia", timing: "supper", kcalFraction: 0.08, roles: ["protein"] },
  ],
};

/**
 * Compatibilidade de horário: para cada momento do dia (o `timing` do template),
 * quais `bestTimes` de um alimento o tornam apropriado ali. É a inteligência que
 * mantém cada alimento na refeição certa — arroz e feijão no almoço/jantar, aveia
 * e pão no café, fruta e iogurte no lanche — em vez de escolher só por macro. Os
 * lanches e a ceia aceitam também os alimentos "de lanche"; as refeições
 * principais e o café ficam estritos, como um brasileiro come de fato.
 */
export const MEAL_TIMING_COMPATIBILITY: Record<MealTiming, MealTiming[]> = {
  breakfast: ["breakfast"],
  lunch: ["lunch"],
  dinner: ["dinner"],
  snack: ["snack"],
  supper: ["supper", "snack"],
  pre_workout: ["pre_workout", "snack"],
  post_workout: ["post_workout", "snack"],
  emergency: ["emergency", "snack", "travel"],
  travel: ["travel", "snack", "emergency"],
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
  legume: { min: 40, max: 200 },
  fat: { min: 5, max: 60 },
  veg: { min: 50, max: 200 },
};

/** Porção fixa dos vegetais (volume alimentar para saciedade). */
export const VEG_FIXED_GRAMS = 120;

/**
 * Porção fixa da leguminosa (feijão e afins) — ≈ 1 concha média. Como o vegetal,
 * é um acompanhamento de porção cultural estável; o arroz (carbo) é quem escala
 * para fechar a energia da refeição.
 */
export const LEGUME_FIXED_GRAMS = 120;

/**
 * Fração mínima das calorias vinda de carboidrato para o par arroz-e-feijão
 * fazer sentido no prato. Abaixo disso — abordagens low carb — a leguminosa sai
 * das refeições principais: a estratégia manda no prato, não o hábito. Flexível
 * fica ~39%; Low Carb, ~24% — o limiar de 30% separa os dois com folga.
 */
export const RICE_AND_BEANS_MIN_CARB_SHARE = 0.3;

/** Arredondamento das porções (múltiplo de gramas). */
export const GRAMS_ROUNDING = 5;

/**
 * Passadas do solver de resíduo (Gauss-Seidel) que ajusta as porções para bater
 * os macros descontando a contribuição cruzada entre alimentos. 4 passadas já
 * convergem com folga para 3 incógnitas fortemente diagonais.
 */
export const SOLVER_PASSES = 4;

/** Pesos do ranqueamento de alimentos (base + ênfases da estratégia). */
export const RANK_WEIGHTS = {
  timingMatch: 20,
  satietyEmphasis: 0.4,
  practicalityEmphasis: 0.4,
  budgetPenaltyPerLevel: 8,
  /**
   * Bônus para alimentos que o aluno já come (recordatório). Grande o bastante
   * para o cardápio priorizar o que ele já tem no dia a dia — máxima aderência —
   * mantendo a lógica de papéis (a proteína entra quando falta).
   */
  habitualBonus: 1000,
} as const;

/** Refeições da noite — alvo do "zero carboidrato à noite" (Personal Nutrition AI). */
export const EVENING_TIMINGS: MealTiming[] = ["dinner", "supper"];

/** Limites sensatos ao interpretar uma instrução em linguagem natural. */
export const DIRECTIVE_LIMITS = {
  /** Faixa aceita de calorias (evita erros de digitação virarem alvos absurdos). */
  minCalories: 800,
  maxCalories: 6000,
  /** Faixa de refeições por dia suportada pelos modelos. */
  minMeals: 3,
  maxMeals: 6,
} as const;

/** Rótulos pt-BR dos papéis. */
export const ROLE_LABELS: Record<FoodRole, string> = {
  protein: "Proteína",
  carb: "Carboidrato",
  legume: "Leguminosa",
  fat: "Gordura boa",
  veg: "Vegetal",
};

/** Objetivo de cada refeição — o "porquê" de cada momento do dia. */
export const MEAL_OBJECTIVES: Record<MealSlot, string> = {
  breakfast: "Energia para começar o dia",
  morning_snack: "Sustentar a fome até o almoço",
  lunch: "Refeição principal — a base do dia",
  afternoon_snack: "Controle da fome e combustível para o treino",
  dinner: "Refeição da noite — proteína e leveza",
  supper: "Ceia — saciedade para uma boa noite",
};
