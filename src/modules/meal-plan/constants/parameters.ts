/**
 * Parâmetros do Plano Alimentar (Documento 08 — nenhum número mágico).
 *
 * Distribuição das refeições, composição por slot, faixas de porção e limiares
 * de classificação vivem aqui — ponto único de verdade, ajustável no futuro
 * pela tela de Configurações.
 */

import type { MealTiming } from "@/modules/foods/types";
import type { StudentGoal } from "@/modules/students/types";
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
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.4, roles: ["protein", "carb", "legume", "veg", "fat"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.3, roles: ["protein", "carb", "legume", "veg", "fat"] },
  ],
  4: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.25, roles: ["protein", "carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.35, roles: ["protein", "carb", "legume", "veg", "fat"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.15, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.25, roles: ["protein", "carb", "legume", "veg", "fat"] },
  ],
  5: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.22, roles: ["protein", "carb", "fat"] },
    { slot: "morning_snack", title: "Lanche da manhã", timing: "snack", kcalFraction: 0.1, roles: ["carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.3, roles: ["protein", "carb", "legume", "veg", "fat"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.13, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.25, roles: ["protein", "carb", "legume", "veg", "fat"] },
  ],
  6: [
    { slot: "breakfast", title: "Café da manhã", timing: "breakfast", kcalFraction: 0.2, roles: ["protein", "carb", "fat"] },
    { slot: "morning_snack", title: "Lanche da manhã", timing: "snack", kcalFraction: 0.1, roles: ["carb", "fat"] },
    { slot: "lunch", title: "Almoço", timing: "lunch", kcalFraction: 0.28, roles: ["protein", "carb", "legume", "veg", "fat"] },
    { slot: "afternoon_snack", title: "Lanche da tarde", timing: "snack", kcalFraction: 0.12, roles: ["protein", "carb"] },
    { slot: "dinner", title: "Jantar", timing: "dinner", kcalFraction: 0.22, roles: ["protein", "carb", "legume", "veg", "fat"] },
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

/**
 * Faixas de porção (g) por papel — porções que um nutricionista serviria de
 * fato (nada de 380 g de fruta ou 300 g de tofu). O teto é o limite de bom senso;
 * a escolha de alimentos densos (abaixo) evita chegar perto dele.
 */
export const PORTION_LIMITS: Record<FoodRole, { min: number; max: number }> = {
  protein: { min: 30, max: 240 },
  carb: { min: 20, max: 320 },
  legume: { min: 40, max: 160 },
  fat: { min: 5, max: 55 },
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

/**
 * Densidade proteica (g de proteína / 100 g) a partir da qual um alimento já é
 * uma boa fonte proteica — o "teto" do bônus. Frango, atum e whey saturam aqui;
 * ricota e tofu ficam abaixo. Assim a proteína densa (porção realista) é
 * preferida, sem que o pó de whey domine todas as refeições.
 */
export const PROTEIN_DENSITY_CAP = 20;

/** Pesos do ranqueamento de alimentos (base + ênfases da estratégia). */
export const RANK_WEIGHTS = {
  timingMatch: 20,
  /**
   * Peso da densidade proteica no papel de proteína (até PROTEIN_DENSITY_CAP).
   * Forte o bastante para elevar frango/ovo/iogurte proteico acima de ricota/tofu
   * — porções realistas —, sem superar o bônus de hábito.
   */
  proteinDensity: 2.5,
  /**
   * Penalidade para ultraprocessados (ex.: whey em pó): o nutricionista prefere
   * comida de verdade. Não bane — o hábito ainda vence —, mas evita que o pó
   * seja a escolha padrão quando há uma fonte integral igualmente boa.
   */
  ultraProcessedPenalty: 30,
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

// ── Motor Inteligente de Substituição Alimentar ────────────────────────────

/**
 * Perfil de objetivo usado para PONDERAR o motor de substituição — 3 perfis
 * bastam para diferenciar as prioridades nutricionais (mais perfis viram ruído
 * sem dado clínico para justificá-los). Mesma ideia de `GOAL_TO_FOOD_GOAL`
 * (mealPlanEngine.ts), só que para pesos de troca em vez de seleção de banco.
 */
export type SubstitutionGoalProfile = "weight_loss" | "hypertrophy" | "balanced";

export const GOAL_TO_SUBSTITUTION_PROFILE: Record<StudentGoal, SubstitutionGoalProfile> = {
  weight_loss: "weight_loss",
  event_preparation: "weight_loss",
  hypertrophy: "hypertrophy",
  performance: "hypertrophy",
  recomposition: "balanced",
  maintenance: "balanced",
  health: "balanced",
};

/**
 * Tolerâncias de equivalência (Modos 2 e 3): dentro da faixa, a troca é tratada
 * como "próxima" (alerta INFO, não ATENÇÃO). Percentual sobre o valor original.
 */
export const REPLACEMENT_TOLERANCES = {
  caloriePercent: 3,
  proteinPercent: 5,
  carbPercent: 5,
  fatPercent: 7,
} as const;

/**
 * Limiares dos alertas de impacto — avaliam SEMPRE impacto absoluto (g/kcal) E
 * percentual sobre o alvo diário, porque +100 kcal pesa mais numa dieta de
 * 1.500 kcal do que numa de 3.500 kcal (Doc 15 — nunca avaliar só o absoluto).
 */
export const REPLACEMENT_ALERT_THRESHOLDS = {
  /** % do alvo calórico diário a partir do qual a troca já chama atenção. */
  dailyKcalAttentionPct: 4,
  /** % do alvo calórico diário — alto impacto. */
  dailyKcalHighImpactPct: 8,
  /** Queda de proteína do dia (g) a partir da qual já chama atenção. */
  proteinDropAttentionG: 5,
  /** Queda de proteína do dia (g) — alto impacto. */
  proteinDropHighImpactG: 15,
  /** Aumento de gordura da refeição (g) a partir do qual já chama atenção. */
  fatIncreaseAttentionG: 5,
  /** Aumento de gordura da refeição (g) — alto impacto. */
  fatIncreaseHighImpactG: 12,
  /** Aumento de sódio da refeição (mg) a partir do qual já chama atenção. */
  sodiumIncreaseAttentionMg: 300,
} as const;

/**
 * Pesos da Recomendação Inteligente (Modo 1): mistura, em gramas, a quantidade
 * que preservaria as calorias com a que preservaria a proteína do item
 * original. Emagrecimento pesa mais o controle calórico; hipertrofia, a
 * proteína disponível — o restante (`balanced`) fica no meio.
 */
export const SMART_MODE_WEIGHTS: Record<
  SubstitutionGoalProfile,
  { calorie: number; protein: number }
> = {
  weight_loss: { calorie: 0.55, protein: 0.45 },
  hypertrophy: { calorie: 0.3, protein: 0.7 },
  balanced: { calorie: 0.45, protein: 0.55 },
};

/**
 * Pesos do ranking de candidatos à troca (0–100 cada componente, soma
 * ponderada). `fatPenalty`/`processingPenalty` só SUBTRAEM quando o substituto
 * piora o critério (nunca bonificam) — o ranking nunca troca praticidade por
 * um número artificialmente alto.
 */
export const REPLACEMENT_SCORE_WEIGHTS: Record<
  SubstitutionGoalProfile,
  { calorieFit: number; proteinFit: number; fatPenalty: number; processingPenalty: number; timingMatch: number }
> = {
  weight_loss: { calorieFit: 0.3, proteinFit: 0.3, fatPenalty: 0.25, processingPenalty: 0.1, timingMatch: 0.05 },
  hypertrophy: { calorieFit: 0.2, proteinFit: 0.45, fatPenalty: 0.1, processingPenalty: 0.1, timingMatch: 0.15 },
  balanced: { calorieFit: 0.3, proteinFit: 0.3, fatPenalty: 0.15, processingPenalty: 0.15, timingMatch: 0.1 },
};

/** Penalidade (pontos) por grama de gordura a mais que o substituto adiciona. */
export const FAT_INCREASE_PENALTY_PER_GRAM = 3;

/** Penalidade (pontos) quando o substituto é ultraprocessado. */
export const PROCESSING_PENALTY_POINTS = 15;

/** Quantos candidatos o ranking devolve para a interface. */
export const REPLACEMENT_CANDIDATES_LIMIT = 8;

/** Objetivo de cada refeição — o "porquê" de cada momento do dia. */
export const MEAL_OBJECTIVES: Record<MealSlot, string> = {
  breakfast: "Energia para começar o dia",
  morning_snack: "Sustentar a fome até o almoço",
  lunch: "Refeição principal — a base do dia",
  afternoon_snack: "Controle da fome e combustível para o treino",
  dinner: "Refeição da noite — proteína e leveza",
  supper: "Ceia — saciedade para uma boa noite",
};
