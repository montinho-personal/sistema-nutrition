/**
 * Motor Inteligente de Substituição Alimentar (Documento 00/08/15).
 *
 * O botão "Trocar" não é uma calculadora de grama-por-grama: mesmo peso não é
 * mesma caloria, mesma caloria não é mesma proteína. Este módulo entende o
 * impacto nutricional REAL de cada troca — na refeição e no dia — e devolve
 * uma recomendação determinística, auditável e reproduzível (a IA, quando
 * ligada, pode enriquecer o texto; o NÚMERO vem sempre daqui).
 *
 * Camada pura de domínio (Documento 11 — regra de negócio nunca em
 * componentes): sem React, 100% testável, reaproveita o motor do cardápio
 * (`mealPlanEngine.ts`) em vez de duplicar a matemática de porções.
 */

import type { Food, MealTiming } from "@/modules/foods/types";
import type { StudentGoal } from "@/modules/students/types";
import { buildDietaryFilter } from "@/modules/meal-plan/services/dietaryFilters";
import {
  buildItemWithGrams,
  classifyRole,
  isTimingAppropriate,
} from "@/modules/meal-plan/services/mealPlanEngine";
import {
  FAT_INCREASE_PENALTY_PER_GRAM,
  GOAL_TO_SUBSTITUTION_PROFILE,
  PORTION_LIMITS,
  PROCESSING_PENALTY_POINTS,
  REPLACEMENT_ALERT_THRESHOLDS,
  REPLACEMENT_CANDIDATES_LIMIT,
  REPLACEMENT_SCORE_WEIGHTS,
  REPLACEMENT_TOLERANCES,
  SMART_MODE_WEIGHTS,
  type SubstitutionGoalProfile,
} from "@/modules/meal-plan/constants/parameters";
import type {
  FoodRole,
  MacroTotals,
  MealItem,
  ReplacementCandidate,
  ReplacementComparison,
  ReplacementDecision,
  ReplacementMode,
  ReplacementWarning,
} from "@/modules/meal-plan/types";

/** Acima desta fração do alvo diário de gordura, a troca evita piorar ainda mais. */
const FAT_NEAR_TARGET_RATIO = 0.9;

// ── Aritmética de equivalência (guardas contra NaN/Infinity/zero/negativo) ──

function clampToRole(role: FoodRole, grams: number): number {
  const limits = PORTION_LIMITS[role];
  if (!Number.isFinite(grams)) return limits.min;
  return Math.min(limits.max, Math.max(limits.min, Math.round(grams)));
}

/** Gramas do alimento para render um alvo de calorias (Modo 2). */
function gramsForCalories(food: Food, role: FoodRole, targetKcal: number): number {
  const per100 = food.nutrition.energyKcal ?? 0;
  if (per100 <= 0 || targetKcal <= 0) return PORTION_LIMITS[role].min;
  return clampToRole(role, (targetKcal * 100) / per100);
}

/** Gramas do alimento para render um alvo de proteína (Modo 3). */
function gramsForProtein(food: Food, role: FoodRole, targetProteinG: number): number {
  const per100 = food.nutrition.proteinG ?? 0;
  if (per100 <= 0 || targetProteinG <= 0) return PORTION_LIMITS[role].min;
  return clampToRole(role, (targetProteinG * 100) / per100);
}

interface SmartContext {
  /** A proteína do dia já está abaixo do alvo — não piorar ainda mais. */
  proteinBelowTarget: boolean;
  /** A gordura do dia já está perto/acima do alvo — evitar piorar ainda mais. */
  fatNearOrOverTarget: boolean;
  originalFatPer100: number;
}

/**
 * Modo 1 — Recomendação Inteligente: mistura, em gramas, a quantidade que
 * preservaria as calorias com a que preservaria a proteína do item original
 * (peso por objetivo — `SMART_MODE_WEIGHTS`), e aplica dois freios contextuais
 * determinísticos:
 *
 *  - se a proteína do DIA já está abaixo do alvo, nunca sugere menos gramas
 *    do que o necessário para manter a proteína do item;
 *  - se a gordura do DIA já está perto/acima do alvo E o substituto é mais
 *    gorduroso (por 100 g) que o original, não deixa a porção passar da
 *    quantidade que preservaria as calorias (evita empilhar gordura).
 *
 * Determinístico e reproduzível: mesmo input, mesmo resultado, sempre.
 */
function computeSmartGrams(
  food: Food,
  role: FoodRole,
  ref: MealItem,
  ctx: SmartContext,
  profile: SubstitutionGoalProfile,
): number {
  const weights = SMART_MODE_WEIGHTS[profile];
  const gCal = gramsForCalories(food, role, ref.kcal);
  const gProt = ref.protein > 0 ? gramsForProtein(food, role, ref.protein) : gCal;
  const blended = gCal * weights.calorie + gProt * weights.protein;

  // Os dois freios agem como LIMITES, não como sobrescritas sequenciais — um
  // não pode simplesmente apagar o outro. Quando os limites colidem (proteger
  // a proteína exigiria mais gramas do que o teto de gordura permite), a
  // proteína vence: é o alvo "duro" da massa magra (mesma filosofia do motor
  // do cardápio — `mealPlanEngine.ts`, proteína/gordura fixas, carbo flexível).
  const proteinFloor = ctx.proteinBelowTarget ? gProt : -Infinity;
  const fatPer100 = food.nutrition.fatG ?? 0;
  const fatCeiling = ctx.fatNearOrOverTarget && fatPer100 > ctx.originalFatPer100 ? gCal : Infinity;

  const grams = proteinFloor > fatCeiling ? proteinFloor : Math.min(Math.max(blended, proteinFloor), fatCeiling);

  return clampToRole(role, grams);
}

/** |valor| como % de uma base (0 quando a base é ≤ 0 — nunca divide por zero). */
function percentOf(value: number, base: number): number {
  return base > 0 ? (Math.abs(value) / base) * 100 : 0;
}

// ── Comparação antes/depois (refeição + dia) ────────────────────────────────

export interface BuildReplacementComparisonInput {
  originalFood: Food;
  originalItem: MealItem;
  replacementFood: Food;
  mode: ReplacementMode;
  /** Totais ATUAIS da refeição (incluem o item original). */
  mealTotals: MacroTotals;
  /** Totais ATUAIS do dia (incluem o item original). */
  dayTotals: MacroTotals;
  dayTarget: MacroTotals;
  goal: StudentGoal;
  /** Gramas explícitas — sobrepõe o cálculo do modo (ajuste manual no diálogo). */
  manualGrams?: number;
}

function applyItemDelta(totals: MacroTotals, before: MealItem, after: MealItem): MacroTotals {
  return {
    kcal: totals.kcal - before.kcal + after.kcal,
    protein: totals.protein - before.protein + after.protein,
    carbs: totals.carbs - before.carbs + after.carbs,
    fat: totals.fat - before.fat + after.fat,
  };
}

/** Sódio (mg) de uma porção — não faz parte de `MealItem`; calculado sob demanda. */
function sodiumForGrams(food: Food, grams: number): number {
  return ((food.nutrition.sodiumMg ?? 0) * grams) / 100;
}

/** Gramas do substituto para um modo — sem `manualGrams` (usada pelo ranking também). */
function gramsForMode(
  mode: ReplacementMode,
  replacementFood: Food,
  originalFood: Food,
  originalItem: MealItem,
  dayTotals: MacroTotals,
  dayTarget: MacroTotals,
  goal: StudentGoal,
): number {
  const role = originalItem.role;
  if (mode === "match_quantity") return originalItem.grams;
  if (mode === "match_calories") return gramsForCalories(replacementFood, role, originalItem.kcal);
  if (mode === "match_protein") return gramsForProtein(replacementFood, role, originalItem.protein);

  const profile = GOAL_TO_SUBSTITUTION_PROFILE[goal];
  const ctx: SmartContext = {
    proteinBelowTarget: dayTotals.protein < dayTarget.protein,
    fatNearOrOverTarget: dayTotals.fat >= dayTarget.fat * FAT_NEAR_TARGET_RATIO,
    originalFatPer100: originalFood.nutrition.fatG ?? 0,
  };
  return computeSmartGrams(replacementFood, role, originalItem, ctx, profile);
}

/**
 * Monta a comparação completa de uma troca: gramas do modo escolhido, impacto
 * na refeição e no dia, alertas e a decisão explicada (NDE). Ponto único de
 * cálculo — a interface NUNCA refaz a conta, só exibe o que sai daqui.
 */
export function buildReplacementComparison(
  input: BuildReplacementComparisonInput,
): ReplacementComparison {
  const { originalFood, originalItem, replacementFood, mode, mealTotals, dayTotals, dayTarget, goal } =
    input;
  const role = originalItem.role;

  const grams =
    input.manualGrams != null && Number.isFinite(input.manualGrams)
      ? Math.max(1, Math.round(input.manualGrams))
      : gramsForMode(mode, replacementFood, originalFood, originalItem, dayTotals, dayTarget, goal);

  const replacementItem = buildItemWithGrams(replacementFood, role, grams);

  const mealAfter = applyItemDelta(mealTotals, originalItem, replacementItem);
  const dayAfter = applyItemDelta(dayTotals, originalItem, replacementItem);
  const delta: MacroTotals = {
    kcal: replacementItem.kcal - originalItem.kcal,
    protein: replacementItem.protein - originalItem.protein,
    carbs: replacementItem.carbs - originalItem.carbs,
    fat: replacementItem.fat - originalItem.fat,
  };
  const sodiumDelta =
    sodiumForGrams(replacementFood, replacementItem.grams) - sodiumForGrams(originalFood, originalItem.grams);

  const warnings = generateReplacementWarnings({ delta, dayTarget, sodiumDelta });
  const decision = buildReplacementDecision({
    mode,
    delta,
    warnings,
    originalFood,
    replacementFood,
    originalItem,
    replacementItem,
    goal,
  });

  return {
    mode,
    originalFood,
    originalItem,
    replacementFood,
    replacementItem,
    mealBefore: mealTotals,
    mealAfter,
    dayBefore: dayTotals,
    dayAfter,
    dayTarget,
    delta,
    warnings,
    decision,
  };
}

// ── Alertas inteligentes (INFO / ATENÇÃO / ALTO IMPACTO) ────────────────────

/**
 * Gera os alertas de uma troca — sempre avaliando impacto ABSOLUTO e
 * PERCENTUAL sobre o alvo diário (Documento 15: +100 kcal pesa mais numa dieta
 * de 1.500 kcal do que numa de 3.500). Nunca fica vazio: sem nada relevante, um
 * INFO confirma que a troca é próxima.
 */
export function generateReplacementWarnings(input: {
  delta: MacroTotals;
  dayTarget: MacroTotals;
  sodiumDelta: number;
}): ReplacementWarning[] {
  const T = REPLACEMENT_ALERT_THRESHOLDS;
  const { delta, dayTarget, sodiumDelta } = input;
  const warnings: ReplacementWarning[] = [];

  const dayKcalPct = percentOf(delta.kcal, dayTarget.kcal);
  const growing = delta.kcal >= 0 ? "adiciona" : "remove";
  if (dayKcalPct >= T.dailyKcalHighImpactPct) {
    warnings.push({
      level: "high_impact",
      message: `Esta troca ${growing} ${Math.abs(Math.round(delta.kcal))} kcal ao dia (${Math.round(dayKcalPct)}% do alvo) e pode ${delta.kcal >= 0 ? "reduzir" : "comprometer"} a estratégia planejada.`,
    });
  } else if (dayKcalPct >= T.dailyKcalAttentionPct) {
    warnings.push({
      level: "attention",
      message: `Esta troca ${growing} ${Math.abs(Math.round(delta.kcal))} kcal ao dia — vale acompanhar.`,
    });
  }

  if (delta.protein <= -T.proteinDropHighImpactG) {
    warnings.push({
      level: "high_impact",
      message: `A proteína diária cai ${Math.abs(Math.round(delta.protein))} g com esta troca — abaixo do que a estratégia prevê.`,
    });
  } else if (delta.protein <= -T.proteinDropAttentionG) {
    warnings.push({
      level: "attention",
      message: `A proteína diária diminui ${Math.abs(Math.round(delta.protein))} g com esta troca.`,
    });
  }

  if (delta.fat >= T.fatIncreaseHighImpactG) {
    warnings.push({
      level: "high_impact",
      message: `Esta substituição aumenta a gordura da refeição em ${Math.round(delta.fat)} g.`,
    });
  } else if (delta.fat >= T.fatIncreaseAttentionG) {
    warnings.push({
      level: "attention",
      message: `Esta substituição aumenta a gordura da refeição em ${Math.round(delta.fat)} g.`,
    });
  }

  if (sodiumDelta >= T.sodiumIncreaseAttentionMg) {
    warnings.push({
      level: "attention",
      message: `O sódio da refeição aumenta cerca de ${Math.round(sodiumDelta)} mg com esta troca.`,
    });
  }

  if (warnings.length === 0) {
    warnings.push({ level: "info", message: "Troca nutricionalmente próxima da original." });
  }
  return warnings;
}

/** true se todos os deltas estão dentro das tolerâncias configuradas. */
export function isWithinTolerance(delta: MacroTotals, original: MealItem): boolean {
  const T = REPLACEMENT_TOLERANCES;
  return (
    percentOf(delta.kcal, original.kcal) <= T.caloriePercent &&
    percentOf(delta.protein, original.protein) <= T.proteinPercent &&
    percentOf(delta.carbs, original.carbs) <= T.carbPercent &&
    percentOf(delta.fat, original.fat) <= T.fatPercent
  );
}

// ── Decisão explicada (Nutrition Decision Engine) ───────────────────────────

const worstLevel = (warnings: ReplacementWarning[]): ReplacementWarning | null => {
  const order: Record<ReplacementWarning["level"], number> = { info: 0, attention: 1, high_impact: 2 };
  return warnings.reduce<ReplacementWarning | null>(
    (worst, w) => (!worst || order[w.level] > order[worst.level] ? w : worst),
    null,
  );
};

function buildReplacementDecision(input: {
  mode: ReplacementMode;
  delta: MacroTotals;
  warnings: ReplacementWarning[];
  originalFood: Food;
  replacementFood: Food;
  originalItem: MealItem;
  replacementItem: MealItem;
  goal: StudentGoal;
}): ReplacementDecision {
  const { mode, delta, warnings, originalFood, replacementFood, originalItem, replacementItem, goal } = input;
  const profile = GOAL_TO_SUBSTITUTION_PROFILE[goal];
  const shortName = (name: string) => name.split(",")[0];

  const headline = `${replacementItem.grams} g de ${shortName(replacementFood.name)} no lugar de ${originalItem.grams} g de ${shortName(originalFood.name)}.`;

  let justification: string;
  if (mode === "smart") {
    justification =
      profile === "weight_loss"
        ? "Esta quantidade equilibra o controle calórico com a manutenção da proteína, preservando o déficit planejado."
        : profile === "hypertrophy"
          ? "Esta quantidade prioriza a proteína disponível, mantendo a energia da refeição próxima do planejado."
          : "Esta quantidade equilibra calorias e proteína, mantendo a refeição próxima da estratégia.";
  } else if (mode === "match_calories") {
    justification = "A quantidade foi ajustada para manter as calorias da refeição praticamente inalteradas.";
  } else if (mode === "match_protein") {
    justification = "A quantidade foi ajustada para manter a oferta de proteína da refeição.";
  } else {
    justification = "Mesma quantidade em gramas do alimento original, sem ajuste automático — confira o impacto abaixo.";
  }

  const worst = worstLevel(warnings);
  const risk = worst && worst.level !== "info" ? worst.message : null;

  let alternative: string | null = null;
  if (risk) {
    if (mode !== "match_protein" && delta.protein < 0) {
      alternative = 'Para maior equivalência proteica, use o modo "Manter proteína".';
    } else if (mode !== "match_calories" && delta.kcal > 0) {
      alternative = 'Para preservar melhor as calorias, use o modo "Manter calorias".';
    } else {
      alternative = "Ajuste a quantidade manualmente para reduzir o impacto.";
    }
  }

  return { headline, justification, risk, alternative };
}

// ── Ranking inteligente de candidatos ───────────────────────────────────────

export interface RankReplacementCandidatesInput {
  originalFood: Food;
  originalItem: MealItem;
  foods: Food[];
  restrictions: string[];
  timing?: MealTiming;
  goal: StudentGoal;
  dayTotals: MacroTotals;
  dayTarget: MacroTotals;
  limit?: number;
}

/**
 * Ranking dos alimentos do mesmo papel, ponderado pelo objetivo do aluno
 * (`REPLACEMENT_SCORE_WEIGHTS`). Cada candidato já traz a porção da
 * Recomendação Inteligente — o treinador vê o número final, não uma
 * abstração. Penalidades (gordura extra, ultraprocessado) só SUBTRAEM: o
 * ranking nunca inventa um bônus para compensar um alimento pior.
 */
export function rankReplacementCandidates(
  input: RankReplacementCandidatesInput,
): ReplacementCandidate[] {
  const { originalFood, originalItem, foods, restrictions, timing, goal, dayTotals, dayTarget } = input;
  const role = originalItem.role;
  const profile = GOAL_TO_SUBSTITUTION_PROFILE[goal];
  const weights = REPLACEMENT_SCORE_WEIGHTS[profile];

  const allowed = buildDietaryFilter(restrictions);
  const ofRole = foods.filter(allowed).filter((f) => f.id !== originalFood.id && classifyRole(f) === role);
  const timely = timing ? ofRole.filter((f) => isTimingAppropriate(f, timing)) : ofRole;
  const pool = timely.length > 0 ? timely : ofRole;

  const smartCtx: SmartContext = {
    proteinBelowTarget: dayTotals.protein < dayTarget.protein,
    fatNearOrOverTarget: dayTotals.fat >= dayTarget.fat * FAT_NEAR_TARGET_RATIO,
    originalFatPer100: originalFood.nutrition.fatG ?? 0,
  };

  return pool
    .map((food) => {
      const grams = computeSmartGrams(food, role, originalItem, smartCtx, profile);
      const item = buildItemWithGrams(food, role, grams);

      const calorieFit = 100 - Math.min(100, percentOf(item.kcal - originalItem.kcal, Math.max(1, originalItem.kcal)));
      const proteinFit =
        100 - Math.min(100, percentOf(item.protein - originalItem.protein, Math.max(1, originalItem.protein)));
      const fatIncrease = Math.max(0, item.fat - originalItem.fat);
      const fatPenalty = fatIncrease * FAT_INCREASE_PENALTY_PER_GRAM;
      const processingPenalty = food.processingLevel === "ultra_processed" ? PROCESSING_PENALTY_POINTS : 0;
      const timingBonus = timing && isTimingAppropriate(food, timing) ? 100 : 0;

      const score =
        weights.calorieFit * calorieFit +
        weights.proteinFit * proteinFit -
        weights.fatPenalty * fatPenalty -
        weights.processingPenalty * processingPenalty +
        weights.timingMatch * timingBonus;

      const reasons: string[] = [];
      if (proteinFit >= 90) reasons.push("proteína equivalente");
      if (fatIncrease <= 0) reasons.push("sem aumento de gordura");
      if (food.processingLevel && food.processingLevel !== "ultra_processed") reasons.push("comida de verdade");

      return { food, item, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.food.id.localeCompare(b.food.id))
    .slice(0, input.limit ?? REPLACEMENT_CANDIDATES_LIMIT);
}
