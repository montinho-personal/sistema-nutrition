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
  computeScoreMap,
  computeScores,
} from "@/modules/diagnosis/services";
import { SCORE_THRESHOLDS } from "@/modules/strategy/constants/parameters";
import { buildStrategy, computeMacros } from "@/modules/strategy/services";
import type { MacroContext, StrategyRecord } from "@/modules/strategy/types";
import type { Food } from "@/modules/foods/types";
import { buildMealPlan, type MealPlanContext } from "@/modules/meal-plan/services";
import type { FollowUp } from "@/modules/follow-ups/types";
import {
  buildEvolutionInsights,
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
}

/**
 * Monta o relatório completo. Exige a cadeia mínima (diagnóstico concluído +
 * objetivo + estratégia com peso). Retorna null se algo faltar.
 */
export function buildStudentReport(input: BuildReportInput): ReportModel | null {
  const { student, session, record, followUps, foods, generatedAt } = input;
  if (!student.mainGoal || !session || session.status !== "completed" || !record) return null;

  const goal = student.mainGoal;
  const answers = session.answers;
  const ageYears = ageFromBirthDate(student.birthDate);
  const goalLabel = STUDENT_GOAL_LABELS[goal];

  const scoreMap = computeScoreMap(answers);
  const scores = computeScores(answers);
  const hypotheses = computeHypotheses(answers);
  const summary = buildExecutiveSummary(answers, { goalLabel, ageYears });

  const strategy = buildStrategy(goal, scoreMap, answers);

  const macroCtx: MacroContext = {
    weightKg: record.input.currentWeightKg,
    bodyFatPct: record.input.bodyFatPct,
    heightCm: student.heightCm,
    ageYears,
    sex: student.sex,
    activity: (answers.activity as string | undefined) ?? null,
    trains: (answers.trains as string | undefined) ?? null,
  };
  const macros = computeMacros(goal, strategy.direction, strategy.velocity, macroCtx);

  const restrictions = Array.isArray(answers.restrictions)
    ? (answers.restrictions as string[])
    : [];
  const mealCtx: MealPlanContext = {
    goal,
    mealsPerDay: strategy.mealsPerDay,
    macros: {
      kcal: macros.calories,
      protein: macros.proteinG,
      carbs: macros.carbG,
      fat: macros.fatG,
    },
    emphasizeSatiety: scoreMap.hungerControl <= SCORE_THRESHOLDS.low,
    emphasizePracticality: scoreMap.practicality <= SCORE_THRESHOLDS.low,
    budgetTight: answers.budget === "apertado",
    restrictions,
    variant: 0,
  };
  const mealPlan = buildMealPlan(foods, mealCtx);

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
    },
    summary,
    scores,
    hypotheses,
    strategy,
    macros,
    mealPlan,
    evolution,
    evolutionInsights,
    roadmap,
  };
}
