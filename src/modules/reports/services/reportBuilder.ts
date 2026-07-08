/**
 * Construtor do Relatório do Aluno (Documento 02 — Documento Final).
 *
 * Ponto único de consolidação: reaproveita TODOS os motores (Diagnóstico,
 * Estratégia, Macros, Plano Alimentar, Acompanhamentos, Roadmap) e os reúne num
 * documento coerente. Determinístico (Documento 08) e sem duplicar lógica
 * (Documento 17 — reutilizar, nunca reconstruir).
 */

import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import {
  ageFromBirthDate,
  buildExecutiveSummary,
  computeHypotheses,
  computeOverallConfidence,
  computeScores,
} from "@/modules/diagnosis/services";
import { DEFAULT_MACRO_PARAMS } from "@/modules/strategy/constants/parameters";
import type { MacroParams, StrategyRecord } from "@/modules/strategy/types";
import type { Food } from "@/modules/foods/types";
import { deriveStudentPlan, resolveStoredDirective } from "@/modules/meal-plan/services";
import type { MealPlanPref } from "@/modules/meal-plan/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import {
  buildEvolutionInsights,
  buildWeightProjection,
  computeEvolution,
  expectedWeeklyKgFromMacros,
} from "@/modules/follow-ups/services";
import { buildRoadmap, type RoadmapContext } from "@/modules/roadmap/services";
import type { ReportModel } from "@/modules/reports/types";

export interface BuildReportInput {
  student: Student;
  session: DiagnosisSession | null;
  record: StrategyRecord | null;
  followUps: FollowUp[];
  foods: Food[];
  /** Data de geração (yyyy-mm-dd) — injetada para manter o builder puro. */
  generatedAt: string;
  /** Parâmetros de macro (Configurações); padrão quando omitido. */
  macroParams?: MacroParams;
  /**
   * Preferências do cardápio (variante, instrução, edições manuais). Quando
   * presentes, o relatório mostra EXATAMENTE o cardápio que o treinador vê e
   * editou no Plano Alimentar — nunca uma segunda versão.
   */
  mealPref?: MealPlanPref | null;
}

/**
 * Monta o relatório completo. Exige a cadeia mínima (diagnóstico concluído +
 * objetivo + estratégia com peso). Retorna null se algo faltar.
 */
export function buildStudentReport(input: BuildReportInput): ReportModel | null {
  const { student, session, record, followUps, foods, generatedAt } = input;
  const macroParams = input.macroParams ?? DEFAULT_MACRO_PARAMS;
  if (!student.mainGoal || !session || session.status !== "completed" || !record) return null;

  const goal = student.mainGoal;
  const answers = session.answers;
  const ageYears = ageFromBirthDate(student.birthDate);
  const goalLabel = STUDENT_GOAL_LABELS[goal];

  const scores = computeScores(answers);
  const hypotheses = computeHypotheses(answers);
  const summary = buildExecutiveSummary(answers, { goalLabel, ageYears });

  // Fonte única da cadeia Estratégia → Macros → Cardápio (a MESMA do Plano
  // Alimentar): variante, instrução e edições manuais valem também aqui.
  const mealPref = input.mealPref ?? null;
  const chain = deriveStudentPlan({
    student,
    session,
    input: record.input,
    followUps,
    foods,
    macroParams,
    variant: mealPref?.variant ?? 0,
    directive: resolveStoredDirective(mealPref),
    edits: mealPref?.edits ?? null,
  });
  if (!chain) return null;
  const { strategy, macros, plan: mealPlan } = chain;

  const expectedWeeklyKg = expectedWeeklyKgFromMacros(
    strategy.direction,
    macros.tdee,
    macros.calories,
  );
  const startDate = record.createdAt.slice(0, 10);
  const evolution =
    followUps.length > 0
      ? computeEvolution(record.input.currentWeightKg, startDate, followUps, expectedWeeklyKg)
      : null;
  const evolutionInsights = evolution ? buildEvolutionInsights(evolution) : [];

  // Projeção de peso: plano × realidade, com o MESMO ritmo/calorias do resto
  // do documento (macros efetivos da fonte única).
  const weightProjection = buildWeightProjection({
    startWeightKg: record.input.currentWeightKg,
    startDate,
    direction: strategy.direction,
    tdee: macros.tdee,
    calories: macros.calories,
    targetChangeKg: record.input.targetChangeKg ?? null,
    targetWeeks: record.input.targetWeeks ?? null,
    followUps,
  });

  const roadmapCtx: RoadmapContext = {
    hasDiagnosis: true,
    hasStrategy: true,
    direction: strategy.direction,
    velocity: strategy.velocity,
    followUpCount: followUps.length,
    weeksElapsed: evolution?.weeksElapsed ?? 0,
    mainChallenge: summary.mainDifficulty,
    mainOpportunity: summary.mainOpportunity,
    startWeight: record.input.currentWeightKg,
    currentWeight: evolution?.currentWeight ?? record.input.currentWeightKg,
    totalChangeKg: evolution?.totalChangeKg ?? 0,
    lastActivityDate: followUps.at(-1)?.date ?? startDate,
  };
  const roadmap = buildRoadmap(roadmapCtx);

  return {
    meta: {
      studentName: student.fullName,
      goalLabel,
      ageYears,
      generatedAt,
      confidence: computeOverallConfidence(answers),
      startWeightKg: record.input.currentWeightKg,
      bodyFatPct: record.input.bodyFatPct,
      targetChangeKg: record.input.targetChangeKg ?? null,
      targetWeeks: record.input.targetWeeks ?? null,
    },
    summary,
    scores,
    hypotheses,
    strategy,
    macros,
    mealPlan,
    weightProjection,
    evolution,
    evolutionInsights,
    roadmap,
  };
}
