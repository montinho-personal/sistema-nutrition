/**
 * Parecer do Nutricionista (Personal Nutrition AI — Fatia B).
 *
 * Sintetiza tudo — diagnóstico, estratégia, gasto energético, macros e o
 * cardápio — num raciocínio individualizado, como o melhor nutricionista
 * esportivo brasileiro explicaria o plano: por que estas escolhas, o que o plano
 * respeita, riscos SEMPRE com solução (Documento 02) e os próximos passos.
 *
 * Determinístico e específico (Documento 08 — regra é a base; a prosa por IA
 * reforça na Fatia B.2). Puxa números e alimentos reais do caso — nunca genérico.
 */

import {
  VELOCITY_LABELS,
  DIRECTION_LABELS,
  SCORE_THRESHOLDS,
} from "@/modules/strategy/constants/parameters";
import { RESTRICTION_LABELS } from "@/modules/meal-plan/services/dietaryFilters";
import {
  resolveAgeYears,
  resolveHeightCm,
  buildExecutiveSummary,
  extractHabitualFoodIds,
  readTrainingContext,
} from "@/modules/diagnosis/services";
import {
  computeEnergyBreakdown,
  evaluateStrategyAlerts,
  projectGoal,
  resolveDietApproach,
  type StrategyAlert,
} from "@/modules/strategy/services";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import {
  buildMemoryNarrative,
  computeEvolution,
  expectedWeeklyKgFromMacros,
} from "@/modules/follow-ups/services";
import type { AnswerMap, ScoreKey, ExecutiveSummary } from "@/modules/diagnosis/types";
import type {
  EnergyBreakdown,
  GoalProjection,
  MacroContext,
  MacroParams,
  MacroTargets,
  NutritionStrategy,
  StrategyInput,
} from "@/modules/strategy/types";
import type { Student } from "@/modules/students/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import { type MemoryNarrative } from "@/modules/follow-ups/services";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import type { MealPlan, MealPlanDirective } from "@/modules/meal-plan/types";

/** Nome de cada alimento por id — para mostrar a aderência aos hábitos no parecer. */
const HABITUAL_NAME_BY_ID = new Map(curatedFoods.map((f) => [f.id, f.name]));

export type OpinionCheckStatus = "ok" | "attention";

/** Um item da checklist "o que este plano respeita". */
export interface OpinionCheck {
  label: string;
  status: OpinionCheckStatus;
  reason: string;
}

/** Um risco — sempre acompanhado da solução (Documento 02). */
export interface OpinionRisk {
  title: string;
  solution: string;
  level: "info" | "attention" | "high";
}

/** O parecer estruturado, pronto para a interface. */
export interface NutritionistOpinion {
  headline: string;
  reading: string[];
  strategyRationale: string[];
  menuRationale: string[];
  respects: OpinionCheck[];
  risks: OpinionRisk[];
  /** Memória do aluno — o que o histórico ensinou (Fatia C). */
  memory: MemoryNarrative;
  nextSteps: string[];
}

export interface NutritionistOpinionInput {
  student: Student;
  goalLabel: string;
  weightKg: number;
  strategy: NutritionStrategy;
  dietApproachLabel: string;
  macros: MacroTargets;
  energy: EnergyBreakdown;
  projection: GoalProjection | null;
  summary: ExecutiveSummary;
  alerts: StrategyAlert[];
  plan: MealPlan;
  scores: Record<ScoreKey, number>;
  directive: MealPlanDirective;
  restrictions: string[];
  /** Quantos alimentos habituais do aluno entraram no cardápio. */
  habitualInPlan: number;
  /** Nomes dos alimentos habituais que entraram no cardápio. */
  habitualUsed: string[];
  /** Nomes dos alimentos habituais reconhecidos que ficaram de fora. */
  habitualMissing: string[];
  trainsRegularly: boolean;
  emphasizeSatiety: boolean;
  emphasizePracticality: boolean;
  budgetTight: boolean;
  /** Memória do aluno (histórico de acompanhamentos). */
  memory: MemoryNarrative;
}

const kcal = (n: number) => `${Math.round(n).toLocaleString("pt-BR")} kcal`;
const firstNameOf = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName;

function energyDeltaPct(tdee: number, calories: number): number {
  if (tdee <= 0) return 0;
  return Math.round((Math.abs(tdee - calories) / tdee) * 100);
}

function buildHeadline(i: NutritionistOpinionInput): string {
  const name = firstNameOf(i.student.fullName);
  const dir = DIRECTION_LABELS[i.strategy.direction].toLowerCase();
  const vel = VELOCITY_LABELS[i.strategy.velocity].toLowerCase();
  const base =
    i.strategy.direction === "manutencao"
      ? `${i.goalLabel} para ${name}: manutenção`
      : `${i.goalLabel} para ${name}: ${dir} em velocidade ${vel}`;
  return `${base}, ${kcal(i.macros.calories)}/dia — priorizando a aderência.`;
}

function buildReading(i: NutritionistOpinionInput): string[] {
  const out: string[] = [i.summary.profile];
  if (i.summary.mainDifficulty && i.summary.mainOpportunity) {
    out.push(
      `A maior dificuldade a contornar é ${i.summary.mainDifficulty.toLowerCase()}; a maior alavanca a favor, ${i.summary.mainOpportunity.toLowerCase()}.`,
    );
  } else if (i.summary.mainOpportunity) {
    out.push(`A maior alavanca a favor é ${i.summary.mainOpportunity.toLowerCase()}.`);
  }
  return out;
}

function buildStrategyRationale(i: NutritionistOpinionInput): string[] {
  const out: string[] = [];
  out.push(
    `Gasto energético estimado em ${kcal(i.energy.tdee)}/dia: ${kcal(i.energy.bmr)} de metabolismo basal, ${kcal(i.energy.trainingKcal)} de treino e ${kcal(i.energy.dailyActivityKcal)} das demais atividades.`,
  );
  if (i.strategy.direction !== "manutencao") {
    const word = i.strategy.direction === "deficit" ? "déficit" : "superávit";
    out.push(
      `Prescrevemos ${kcal(i.macros.calories)} — um ${word} de ${energyDeltaPct(i.energy.tdee, i.macros.calories)}% sobre o gasto, coerente com uma velocidade ${VELOCITY_LABELS[i.strategy.velocity].toLowerCase()}.`,
    );
  } else {
    out.push(`Prescrevemos ${kcal(i.macros.calories)} para manter o peso com a composição atual.`);
  }
  const proteinPerKg = i.weightKg > 0 ? i.macros.proteinG / i.weightKg : 0;
  out.push(
    `Proteína em ${proteinPerKg.toFixed(1)} g/kg (${i.macros.proteinG} g) preserva a massa magra${i.trainsRegularly ? " e sustenta o treino" : ""}.`,
  );
  if (i.projection) {
    out.push(`Ritmo da meta: ${i.projection.realism.level}. ${i.projection.realism.reason}`);
    if (i.projection.muscle && i.projection.muscle.estimatedLeanLossKg > 0) {
      out.push(i.projection.muscle.note);
    }
  }
  return out;
}

function buildMenuRationale(i: NutritionistOpinionInput): string[] {
  const name = firstNameOf(i.student.fullName);
  const out: string[] = [];
  if (i.habitualUsed.length > 0) {
    out.push(
      `Parte do que ${name} já come — entraram ${i.habitualUsed.join(", ")} —, porque aderência vem antes de perfeição.`,
    );
    if (i.habitualMissing.length > 0)
      out.push(
        `Do que ele relatou, ficaram de fora: ${i.habitualMissing.join(", ")} — dá para trocar por eles quando quiser.`,
      );
  } else {
    out.push(
      "Montamos com alimentos comuns e acessíveis do dia a dia brasileiro, para o plano caber na rotina.",
    );
  }
  const emphases: string[] = [];
  if (i.emphasizeSatiety) emphases.push("saciedade (controle de fome baixo)");
  if (i.emphasizePracticality) emphases.push("praticidade (rotina corrida)");
  if (i.budgetTight) emphases.push("custo acessível");
  if (emphases.length > 0) out.push(`Seleção priorizou ${emphases.join(", ")}.`);

  if (i.restrictions.some((r) => r !== "nenhuma" && RESTRICTION_LABELS[r])) {
    const labels = i.restrictions
      .filter((r) => r !== "nenhuma" && RESTRICTION_LABELS[r])
      .map((r) => RESTRICTION_LABELS[r]);
    out.push(`Respeita as restrições informadas: ${labels.join(", ")}.`);
  }

  if (i.directive.recognized.length > 0) {
    out.push(`Ajustado à sua instrução: ${i.directive.recognized.join(", ")}.`);
  }

  out.push(
    `Fechamento fiel ao alvo: ${i.plan.accuracy.kcal}% das calorias e ${i.plan.accuracy.protein}% da proteína.`,
  );
  return out;
}

function buildRespects(i: NutritionistOpinionInput): OpinionCheck[] {
  const checks: OpinionCheck[] = [];

  checks.push({
    label: "Objetivo",
    status: "ok",
    reason: `Calorias e macros alinhados a ${i.goalLabel.toLowerCase()}.`,
  });

  checks.push({
    label: "Rotina e horários",
    status: "ok",
    reason: `${i.strategy.mealsPerDay} refeições distribuídas no dia.`,
  });

  checks.push(
    i.trainsRegularly
      ? {
          label: "Treino",
          status: "ok",
          reason: `Gasto do treino (${kcal(i.energy.trainingKcal)}) já incluído no cálculo.`,
        }
      : {
          label: "Treino",
          status: "attention",
          reason: "Sem treino regular informado — reavaliar quando começar.",
        },
  );

  checks.push({
    label: "Orçamento",
    status: "ok",
    reason: i.budgetTight
      ? "Priorizou alimentos de menor custo."
      : "Sem restrição de custo informada; alimentos acessíveis.",
  });

  checks.push(
    i.habitualInPlan > 0
      ? {
          label: "Preferências e hábitos",
          status: "ok",
          reason: `Parte do que o aluno já come (${i.habitualInPlan} no prato).`,
        }
      : {
          label: "Preferências e hábitos",
          status: "attention",
          reason: "Poucos hábitos alimentares capturados — enriquecer na anamnese aumenta a adesão.",
        },
  );

  const hungerOk = !i.emphasizeSatiety || i.plan.meals.length >= 4;
  checks.push({
    label: "Fome e saciedade",
    status: hungerOk ? "ok" : "attention",
    reason: i.emphasizeSatiety
      ? "Controle de fome baixo — seleção saciante e refeições fracionadas."
      : "Sem sinal de fome descontrolada na anamnese.",
  });

  return checks;
}

const ALERT_LEVEL_TO_RISK: Record<StrategyAlert["level"], OpinionRisk["level"]> = {
  green: "info",
  yellow: "attention",
  orange: "attention",
  red: "high",
};

function buildRisks(i: NutritionistOpinionInput): OpinionRisk[] {
  const risks: OpinionRisk[] = [];
  for (const a of i.alerts) {
    if (a.level === "green") continue;
    risks.push({ title: a.title, solution: a.detail, level: ALERT_LEVEL_TO_RISK[a.level] });
  }
  if (i.projection) {
    for (const r of i.projection.risks) {
      if (risks.some((x) => x.title === r)) continue;
      risks.push({
        title: r,
        solution: i.projection.suggestion
          ? `Alternativa mais segura: ${i.projection.suggestion.weeklyRateKg.toFixed(2)} kg/semana em ${i.projection.suggestion.weeks} semanas.`
          : "Acompanhar de perto e ajustar o ritmo se necessário.",
        level: "attention",
      });
    }
  }
  return risks;
}

function buildNextSteps(i: NutritionistOpinionInput): string[] {
  const out: string[] = [
    "Reavalie em 1–2 semanas com peso e medidas: se a fome subir ou a energia cair, ajustamos antes de perder a aderência.",
  ];
  if (i.projection?.suggestion) {
    out.push(
      `Se o ritmo pesar, há um caminho mais tranquilo: ${i.projection.suggestion.weeklyRateKg.toFixed(2)} kg/semana em ${i.projection.suggestion.weeks} semanas.`,
    );
  }
  if (i.directive.unsupported.length > 0) {
    out.push(`Pedidos ainda não automatizados para ajuste manual: ${i.directive.unsupported.join(", ")}.`);
  }
  return out;
}

/** Monta o parecer completo do nutricionista a partir do caso do aluno. */
export function buildNutritionistOpinion(input: NutritionistOpinionInput): NutritionistOpinion {
  return {
    headline: buildHeadline(input),
    reading: buildReading(input),
    strategyRationale: buildStrategyRationale(input),
    menuRationale: buildMenuRationale(input),
    respects: buildRespects(input),
    risks: buildRisks(input),
    memory: input.memory,
    nextSteps: buildNextSteps(input),
  };
}

/** Ingredientes crus do parecer — de onde derivamos energia, evolução, etc. */
export interface OpinionSources {
  student: Student;
  answers: AnswerMap;
  strategyInput: StrategyInput;
  strategy: NutritionStrategy;
  macros: MacroTargets;
  scores: Record<ScoreKey, number>;
  plan: MealPlan;
  followUps: FollowUp[];
  directive: MealPlanDirective;
  macroParams: MacroParams;
  /** Data de início da evolução (yyyy-mm-dd) — createdAt do registro de estratégia. */
  startDate: string;
}

/**
 * Deriva o input completo do parecer a partir dos ingredientes crus. Ponto único
 * de montagem — reaproveitado pela tela do Plano e pelo Documento Premium, para
 * o parecer ser idêntico nos dois (Documento 17 — reutilizar, nunca reconstruir).
 */
export function buildOpinionInput(s: OpinionSources): NutritionistOpinionInput {
  const goal = s.strategy.goal;
  const ageYears = resolveAgeYears(s.student, s.answers);
  const goalLabel = STUDENT_GOAL_LABELS[goal];
  const trainsRegularly = s.answers.trains === "regular";

  const macroCtx: MacroContext = {
    weightKg: s.strategyInput.currentWeightKg,
    bodyFatPct: s.strategyInput.bodyFatPct,
    heightCm: resolveHeightCm(s.student, s.answers),
    ageYears,
    sex: s.student.sex,
    activity: (s.answers.activity as string | undefined) ?? null,
    trains: (s.answers.trains as string | undefined) ?? null,
    ...readTrainingContext(s.answers),
  };
  const energy = computeEnergyBreakdown(macroCtx);

  const projection =
    s.strategy.direction !== "manutencao" && s.strategyInput.targetChangeKg && s.strategyInput.targetWeeks
      ? projectGoal({
          currentWeightKg: s.strategyInput.currentWeightKg,
          targetChangeKg: s.strategyInput.targetChangeKg,
          weeks: s.strategyInput.targetWeeks,
          direction: s.strategy.direction,
          velocity: s.strategy.velocity,
          tdee: s.macros.tdee,
          prescribedDeltaPct:
            s.strategy.direction === "deficit"
              ? s.macroParams.velocityDeficitPct[s.strategy.velocity]
              : s.macroParams.velocitySurplusPct[s.strategy.velocity],
          trainsRegularly,
          proteinAdequate: s.macroParams.proteinGPerKg[goal] >= 1.6,
          capacity: s.scores.adherence + s.scores.consistency - s.scores.abandonmentRisk,
        })
      : null;

  const evolution =
    s.followUps.length > 0
      ? computeEvolution(
          s.strategyInput.currentWeightKg,
          s.startDate,
          s.followUps,
          expectedWeeklyKgFromMacros(s.strategy.direction, s.macros.tdee, s.macros.calories),
        )
      : null;

  const restrictions = Array.isArray(s.answers.restrictions)
    ? (s.answers.restrictions as string[])
    : [];
  const habitualIds = new Set(extractHabitualFoodIds(s.answers));
  const planFoodIds = new Set(s.plan.meals.flatMap((m) => m.items.map((it) => it.foodId)));
  // Nomes curtos, sem repetir, para o parecer mostrar a aderência aos hábitos.
  const shortName = (id: string) =>
    (HABITUAL_NAME_BY_ID.get(id) ?? "").split(",")[0].trim();
  const habitualNames = (predicate: (id: string) => boolean) =>
    Array.from(
      new Set(
        [...habitualIds].filter(predicate).map(shortName).filter((n) => n.length > 0),
      ),
    );
  const usedAll = habitualNames((id) => planFoodIds.has(id));
  const usedSet = new Set(usedAll);
  const habitualUsed = usedAll.slice(0, 6);
  // "Faltaram" nunca repete o que já entrou (variações com o mesmo nome curto,
  // ex.: Pão francês entrou, Pão integral não).
  const habitualMissing = habitualNames((id) => !planFoodIds.has(id))
    .filter((n) => !usedSet.has(n))
    .slice(0, 6);

  return {
    student: s.student,
    goalLabel,
    weightKg: s.strategyInput.currentWeightKg,
    strategy: s.strategy,
    dietApproachLabel: resolveDietApproach(s.strategyInput.dietApproach ?? null, goal).label,
    macros: s.macros,
    energy,
    projection,
    summary: buildExecutiveSummary(s.answers, { goalLabel, ageYears }),
    alerts: evaluateStrategyAlerts({
      calories: s.macros.calories,
      proteinG: s.macros.proteinG,
      fatG: s.macros.fatG,
      tdee: s.macros.tdee,
      weightKg: s.strategyInput.currentWeightKg,
      direction: s.strategy.direction,
      trainsRegularly,
    }),
    plan: s.plan,
    scores: s.scores,
    directive: s.directive,
    habitualUsed,
    habitualMissing,
    restrictions,
    habitualInPlan: [...habitualIds].filter((id) => planFoodIds.has(id)).length,
    trainsRegularly,
    emphasizeSatiety: s.scores.hungerControl <= SCORE_THRESHOLDS.low,
    emphasizePracticality: s.scores.practicality <= SCORE_THRESHOLDS.low,
    budgetTight: s.answers.budget === "apertado",
    memory: buildMemoryNarrative(s.followUps, evolution),
  };
}
