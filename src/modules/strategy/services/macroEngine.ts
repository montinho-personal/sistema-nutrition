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
  DEFAULT_MACRO_PARAMS,
  FALLBACK_KCAL_PER_KG,
  KATCH,
  KCAL_PER_GRAM,
  MAX_ACTIVITY_FACTOR,
  MIFFLIN,
  TRAINING_BONUS,
} from "@/modules/strategy/constants/parameters";
import type { StudentGoal } from "@/modules/students/types";
import type {
  BmrMethod,
  EnergyDirection,
  MacroContext,
  MacroOverride,
  MacroParams,
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
  params: MacroParams = DEFAULT_MACRO_PARAMS,
  override?: MacroOverride | null,
  caloriesTarget?: number | null,
): MacroTargets {
  const { bmr, method } = computeBmr(ctx);
  const activityFactor = computeActivityFactor(ctx);
  const tdee = bmr * activityFactor;
  const reference = {
    bmr: Math.round(bmr),
    bmrMethod: method,
    activityFactor,
    tdee: Math.round(tdee),
  };

  // Ajuste manual do treinador: calorias e divisão de macros vêm dele; o cálculo
  // automático fica como referência (BMR/TDEE preservados na justificativa).
  if (override) {
    return applyOverride(override, ctx.weightKg, reference);
  }

  const deficitPct = params.velocityDeficitPct[velocity];
  const surplusPct = params.velocitySurplusPct[velocity];
  const proteinPerKg = params.proteinGPerKg[goal];

  // Calorias-alvo: a meta (Definição Estratégica) manda quando informada; senão,
  // direção do objetivo × velocidade prescrita.
  const fromGoal = caloriesTarget !== undefined && caloriesTarget !== null;
  let calories = tdee;
  if (fromGoal) calories = caloriesTarget;
  else if (direction === "deficit") calories = tdee * (1 - deficitPct);
  else if (direction === "superavit") calories = tdee * (1 + surplusPct);
  calories = roundTo(calories, CALORIE_ROUNDING);

  // Proteína (por objetivo) e gordura (piso) primeiro; carboidrato fecha a conta.
  const proteinG = Math.round(proteinPerKg * ctx.weightKg);
  const fatG = Math.round(params.fatGPerKg * ctx.weightKg);
  const proteinKcal = proteinG * KCAL_PER_GRAM.protein;
  const fatKcal = fatG * KCAL_PER_GRAM.fat;
  const carbKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbG = Math.round(carbKcal / KCAL_PER_GRAM.carb);

  const calorieLine = fromGoal
    ? `Calorias-alvo ${calories} kcal — definidas pela meta (Definição Estratégica).`
    : direction === "deficit"
      ? `Déficit de ${Math.round(deficitPct * 100)}% (velocidade) → ${calories} kcal.`
      : direction === "superavit"
        ? `Superávit de ${Math.round(surplusPct * 100)}% (velocidade) → ${calories} kcal.`
        : `Manutenção → ${calories} kcal.`;

  const justifications = [
    `BMR ${Math.round(bmr)} kcal por ${METHOD_LABEL[method]}.`,
    `TDEE ${Math.round(tdee)} kcal = BMR × fator de atividade ${activityFactor.toFixed(3)}.`,
    calorieLine,
    `Proteína ${proteinG} g (${proteinPerKg} g/kg) — preserva massa magra e saciedade.`,
    `Gordura ${fatG} g (piso de ${params.fatGPerKg} g/kg) — suporte hormonal e sabor.`,
    `Carboidrato ${carbG} g — completa as calorias restantes, combustível do treino.`,
  ];

  return {
    ...reference,
    calories,
    proteinG,
    fatG,
    carbG,
    proteinKcal,
    fatKcal,
    carbKcal: carbG * KCAL_PER_GRAM.carb,
    justifications,
    manual: false,
  };
}

/** Converte um ajuste manual (kcal + % de cada macro) em gramas e kcal por macro. */
function applyOverride(
  override: MacroOverride,
  weightKg: number,
  reference: Pick<MacroTargets, "bmr" | "bmrMethod" | "activityFactor" | "tdee">,
): MacroTargets {
  const calories = Math.round(override.calories);
  const proteinG = Math.round((calories * override.proteinPct) / 100 / KCAL_PER_GRAM.protein);
  const carbG = Math.round((calories * override.carbPct) / 100 / KCAL_PER_GRAM.carb);
  const fatG = Math.round((calories * override.fatPct) / 100 / KCAL_PER_GRAM.fat);
  const proteinKcal = proteinG * KCAL_PER_GRAM.protein;
  const carbKcal = carbG * KCAL_PER_GRAM.carb;
  const fatKcal = fatG * KCAL_PER_GRAM.fat;
  const perKg = (g: number) => (weightKg > 0 ? (g / weightKg).toFixed(1) : "—");

  const justifications = [
    `Ajuste manual do treinador: ${calories} kcal (cálculo automático sobrescrito).`,
    `Proteína ${proteinG} g — ${override.proteinPct}% das calorias (${perKg(proteinG)} g/kg).`,
    `Carboidrato ${carbG} g — ${override.carbPct}% das calorias.`,
    `Gordura ${fatG} g — ${override.fatPct}% das calorias (${perKg(fatG)} g/kg).`,
    `Referência automática: TDEE ${reference.tdee} kcal (BMR ${reference.bmr} × fator ${reference.activityFactor.toFixed(3)}).`,
  ];

  return {
    ...reference,
    calories,
    proteinG,
    fatG,
    carbG,
    proteinKcal,
    fatKcal,
    carbKcal,
    justifications,
    manual: true,
  };
}
