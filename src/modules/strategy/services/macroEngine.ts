/**
 * Motor de Macros (Documento 04 — só depois da estratégia).
 *
 * Determinístico e auditável: BMR → TDEE → calorias-alvo (direção do objetivo ×
 * velocidade) → proteína/gordura/carboidrato. Todos os parâmetros vêm de
 * `constants/parameters.ts` (Documento 08 — nenhum número mágico) e cada número
 * final acompanha a justificativa de como foi obtido.
 */

import {
  ACTIVITY_FACTORS,
  CALORIE_ROUNDING,
  DEFAULT_ACTIVITY_FACTOR,
  FALLBACK_KCAL_PER_KG,
  FAT_G_PER_KG,
  KATCH,
  KCAL_PER_GRAM,
  MAX_ACTIVITY_FACTOR,
  MIFFLIN,
  PROTEIN_G_PER_KG,
  TRAINING_BONUS,
  VELOCITY_DEFICIT_PCT,
  VELOCITY_SURPLUS_PCT,
} from "@/modules/strategy/constants/parameters";
import type { StudentGoal } from "@/modules/students/types";
import type {
  BmrMethod,
  EnergyDirection,
  MacroContext,
  MacroTargets,
  StrategyVelocity,
} from "@/modules/strategy/types";

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** BMR pelo método mais preciso disponível para os dados do aluno. */
function computeBmr(ctx: MacroContext): { bmr: number; method: BmrMethod } {
  // Katch-McArdle: melhor quando há % de gordura (usa massa magra).
  if (ctx.bodyFatPct !== null && ctx.bodyFatPct > 0) {
    const leanMass = ctx.weightKg * (1 - ctx.bodyFatPct / 100);
    return { bmr: KATCH.base + KATCH.lbmFactor * leanMass, method: "katch_mcardle" };
  }
  // Mifflin-St Jeor: exige altura, idade e sexo.
  if (ctx.heightCm && ctx.ageYears !== null && ctx.sex && ctx.sex !== "other") {
    const offset = ctx.sex === "male" ? MIFFLIN.sexOffsetMale : MIFFLIN.sexOffsetFemale;
    const bmr =
      MIFFLIN.weight * ctx.weightKg +
      MIFFLIN.height * ctx.heightCm -
      MIFFLIN.age * ctx.ageYears +
      offset;
    return { bmr, method: "mifflin" };
  }
  // Fallback: estimativa por kg quando faltam dados.
  return { bmr: ctx.weightKg * FALLBACK_KCAL_PER_KG, method: "fallback" };
}

/** Fator de atividade total (base + bônus de treino), limitado pelo teto. */
function computeActivityFactor(ctx: MacroContext): number {
  const base = (ctx.activity && ACTIVITY_FACTORS[ctx.activity]) || DEFAULT_ACTIVITY_FACTOR;
  const bonus = (ctx.trains && TRAINING_BONUS[ctx.trains]) || 0;
  return Math.min(MAX_ACTIVITY_FACTOR, base + bonus);
}

const METHOD_LABEL: Record<BmrMethod, string> = {
  katch_mcardle: "Katch-McArdle (usa massa magra)",
  mifflin: "Mifflin-St Jeor",
  fallback: "estimativa por peso (faltavam altura/idade/sexo)",
};

/**
 * Calcula os alvos de macro a partir da estratégia (direção + velocidade) e do
 * contexto antropométrico do aluno.
 */
export function computeMacros(
  goal: StudentGoal,
  direction: EnergyDirection,
  velocity: StrategyVelocity,
  ctx: MacroContext,
): MacroTargets {
  const { bmr, method } = computeBmr(ctx);
  const activityFactor = computeActivityFactor(ctx);
  const tdee = bmr * activityFactor;

  // Direção do objetivo × velocidade → calorias-alvo.
  let calories = tdee;
  if (direction === "deficit") calories = tdee * (1 - VELOCITY_DEFICIT_PCT[velocity]);
  else if (direction === "superavit") calories = tdee * (1 + VELOCITY_SURPLUS_PCT[velocity]);
  calories = roundTo(calories, CALORIE_ROUNDING);

  // Proteína (por objetivo) e gordura (piso) primeiro; carboidrato fecha a conta.
  const proteinG = Math.round(PROTEIN_G_PER_KG[goal] * ctx.weightKg);
  const fatG = Math.round(FAT_G_PER_KG * ctx.weightKg);
  const proteinKcal = proteinG * KCAL_PER_GRAM.protein;
  const fatKcal = fatG * KCAL_PER_GRAM.fat;
  const carbKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbG = Math.round(carbKcal / KCAL_PER_GRAM.carb);

  const justifications = [
    `BMR ${Math.round(bmr)} kcal por ${METHOD_LABEL[method]}.`,
    `TDEE ${Math.round(tdee)} kcal = BMR × fator de atividade ${activityFactor.toFixed(3)}.`,
    direction === "deficit"
      ? `Déficit de ${Math.round(VELOCITY_DEFICIT_PCT[velocity] * 100)}% (velocidade) → ${calories} kcal.`
      : direction === "superavit"
        ? `Superávit de ${Math.round(VELOCITY_SURPLUS_PCT[velocity] * 100)}% (velocidade) → ${calories} kcal.`
        : `Manutenção → ${calories} kcal.`,
    `Proteína ${proteinG} g (${PROTEIN_G_PER_KG[goal]} g/kg) — preserva massa magra e saciedade.`,
    `Gordura ${fatG} g (piso de ${FAT_G_PER_KG} g/kg) — suporte hormonal e sabor.`,
    `Carboidrato ${carbG} g — completa as calorias restantes, combustível do treino.`,
  ];

  return {
    bmr: Math.round(bmr),
    bmrMethod: method,
    activityFactor,
    tdee: Math.round(tdee),
    calories,
    proteinG,
    fatG,
    carbG,
    proteinKcal,
    fatKcal,
    carbKcal: carbG * KCAL_PER_GRAM.carb,
    justifications,
  };
}
