"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession, ScoreKey } from "@/modules/diagnosis/types";
import {
  ageFromBirthDate,
  computeScoreMap,
  extractHabitualFoodIds,
  readTrainingContext,
} from "@/modules/diagnosis/services";
import { buildStrategy, resolveDietApproach, resolveMacros } from "@/modules/strategy/services";
import { SCORE_THRESHOLDS } from "@/modules/strategy/constants/parameters";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import type {
  MacroContext,
  MacroTargets,
  NutritionStrategy,
  StrategyInput,
} from "@/modules/strategy/types";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  applyDirective,
  buildMealPlan,
  parseDirective,
  type MealPlanContext,
} from "@/modules/meal-plan/services";
import { useMealPlanVariant } from "@/modules/meal-plan/hooks/use-meal-plan-variant";
import { useMealPlanInstruction } from "@/modules/meal-plan/hooks/use-meal-plan-instruction";
import { useFollowUps } from "@/modules/follow-ups/hooks/use-follow-ups";
import { summarizeAdherenceSignals } from "@/modules/follow-ups/services";
import type { MealPlan, MealPlanDirective } from "@/modules/meal-plan/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

export interface StudentPlan {
  student: Student | null;
  session: DiagnosisSession | null;
  input: StrategyInput | null;
  strategy: NutritionStrategy | null;
  macros: MacroTargets | null;
  scores: Record<ScoreKey, number> | null;
  plan: MealPlan | null;
  restrictions: string[];
  mealsPerDay: number | null;
  variant: number;
  nextVariant: () => void;
  /** Instrução do treinador em linguagem natural (texto cru). */
  instruction: string;
  setInstruction: (text: string, directive: MealPlanDirective | null) => void;
  /** O que a instrução foi entendida como (para transparência na interface). */
  directive: MealPlanDirective;
}

/**
 * Cadeia Diagnóstico → Estratégia → Macros → Cardápio de um aluno, reativa e
 * determinística. Fonte única reaproveitada pelo Plano Alimentar e pela
 * Validação (nunca recalculam de formas diferentes).
 */
export function useStudentPlan(studentId: string): StudentPlan {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const { input } = useStrategyInput(studentId);
  const macroParams = useMacroParams();
  const { variant, next } = useMealPlanVariant(studentId);
  const { instruction, storedDirective, setInstruction } = useMealPlanInstruction(studentId);
  const { followUps } = useFollowUps(studentId);
  // Memória de aderência: adaptações SEGURAS do histórico moldam o cardápio.
  const memorySignals = React.useMemo(() => summarizeAdherenceSignals(followUps), [followUps]);
  // Usa a interpretação persistida (pode ter sido enriquecida pela IA); na
  // ausência, cai no parser determinístico (instantâneo, sem rede).
  const directive = React.useMemo(
    () => storedDirective ?? parseDirective(instruction),
    [storedDirective, instruction],
  );

  const student = React.useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );
  const session = React.useMemo(
    () =>
      sessions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
    [sessions, studentId],
  );
  const restrictions = React.useMemo(
    () =>
      Array.isArray(session?.answers.restrictions)
        ? (session?.answers.restrictions as string[])
        : [],
    [session],
  );

  const derived = React.useMemo(() => {
    if (!student?.mainGoal || !session || session.status !== "completed" || !input) {
      return { strategy: null, macros: null, scores: null, plan: null, mealsPerDay: null };
    }
    const scores = computeScoreMap(session.answers);
    const strategy = buildStrategy(student.mainGoal, scores, session.answers);
    const macroCtx: MacroContext = {
      weightKg: input.currentWeightKg,
      bodyFatPct: input.bodyFatPct,
      heightCm: student.heightCm,
      ageYears: ageFromBirthDate(student.birthDate),
      sex: student.sex,
      activity: (session.answers.activity as string | undefined) ?? null,
      trains: (session.answers.trains as string | undefined) ?? null,
      ...readTrainingContext(session.answers),
    };
    const macros = resolveMacros(student.mainGoal, strategy, macroCtx, macroParams, input);
    const approach = resolveDietApproach(input.dietApproach ?? null, student.mainGoal);
    const mealsPerDay = approach.meals ?? strategy.mealsPerDay;
    const baseCtx: MealPlanContext = {
      goal: student.mainGoal,
      mealsPerDay,
      macros: { kcal: macros.calories, protein: macros.proteinG, carbs: macros.carbG, fat: macros.fatG },
      // A anamnese OU o histórico de acompanhamentos podem pedir a adaptação.
      emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low || memorySignals.emphasizeSatiety,
      emphasizePracticality:
        scores.practicality <= SCORE_THRESHOLDS.low || memorySignals.emphasizePracticality,
      budgetTight: session.answers.budget === "apertado",
      restrictions,
      variant,
      habitualFoodIds: extractHabitualFoodIds(session.answers),
    };
    // A instrução do treinador ajusta o contexto — a estratégia continua a base.
    const ctx = applyDirective(baseCtx, directive);
    return { strategy, macros, scores, plan: buildMealPlan(curatedFoods, ctx), mealsPerDay };
  }, [student, session, input, restrictions, variant, macroParams, directive, memorySignals]);

  return {
    student,
    session,
    input,
    restrictions,
    variant,
    nextVariant: next,
    instruction,
    setInstruction,
    directive,
    ...derived,
  };
}
