"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession, ScoreKey } from "@/modules/diagnosis/types";
import { ageFromBirthDate, computeScoreMap, readTrainingContext } from "@/modules/diagnosis/services";
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
import { buildMealPlan, type MealPlanContext } from "@/modules/meal-plan/services";
import { useMealPlanVariant } from "@/modules/meal-plan/hooks/use-meal-plan-variant";
import type { MealPlan } from "@/modules/meal-plan/types";

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
    const ctx: MealPlanContext = {
      goal: student.mainGoal,
      mealsPerDay,
      macros: { kcal: macros.calories, protein: macros.proteinG, carbs: macros.carbG, fat: macros.fatG },
      emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low,
      emphasizePracticality: scores.practicality <= SCORE_THRESHOLDS.low,
      budgetTight: session.answers.budget === "apertado",
      restrictions,
      variant,
    };
    return { strategy, macros, scores, plan: buildMealPlan(curatedFoods, ctx), mealsPerDay };
  }, [student, session, input, restrictions, variant, macroParams]);

  return {
    student,
    session,
    input,
    restrictions,
    variant,
    nextVariant: next,
    ...derived,
  };
}
