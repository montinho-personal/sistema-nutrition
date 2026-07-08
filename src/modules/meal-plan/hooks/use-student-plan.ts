"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession, ScoreKey } from "@/modules/diagnosis/types";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import type { MacroTargets, NutritionStrategy, StrategyInput } from "@/modules/strategy/types";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { deriveStudentPlan, parseDirective } from "@/modules/meal-plan/services";
import { useMealPlanVariant } from "@/modules/meal-plan/hooks/use-meal-plan-variant";
import { useMealPlanInstruction } from "@/modules/meal-plan/hooks/use-meal-plan-instruction";
import { useMealPlanEdits } from "@/modules/meal-plan/hooks/use-meal-plan-edits";
import { useFollowUps } from "@/modules/follow-ups/hooks/use-follow-ups";
import type {
  EditedMealPlan,
  MealPlanDirective,
  MealPlanEdits,
} from "@/modules/meal-plan/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

export interface StudentPlan {
  student: Student | null;
  session: DiagnosisSession | null;
  input: StrategyInput | null;
  strategy: NutritionStrategy | null;
  macros: MacroTargets | null;
  scores: Record<ScoreKey, number> | null;
  /** O cardápio final (motor + instrução + edições manuais do treinador). */
  plan: EditedMealPlan | null;
  restrictions: string[];
  mealsPerDay: number | null;
  variant: number;
  nextVariant: () => void;
  /** Instrução do treinador em linguagem natural (texto cru). */
  instruction: string;
  setInstruction: (text: string, directive: MealPlanDirective | null) => void;
  /** O que a instrução foi entendida como (para transparência na interface). */
  directive: MealPlanDirective;
  /** Edições manuais persistidas (null = cardápio como gerado). */
  edits: MealPlanEdits | null;
  /** Define o nº de refeições pelo controle do quadro (null = automático). */
  setMealsPerDay: (mealsPerDay: number | null) => void;
}

/**
 * Cadeia Diagnóstico → Estratégia → Macros → Cardápio de um aluno, reativa e
 * determinística. Delega ao `deriveStudentPlan` (fonte única, também usada pelo
 * Relatório) — o Plano, a Validação e o Documento nunca recalculam diferente.
 */
export function useStudentPlan(studentId: string): StudentPlan {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const { input } = useStrategyInput(studentId);
  const macroParams = useMacroParams();
  const { variant, next } = useMealPlanVariant(studentId);
  const { instruction, storedDirective, setInstruction, mealsPerDay: mealsPerDayOverride, setMealsPerDay } =
    useMealPlanInstruction(studentId);
  const edits = useMealPlanEdits(studentId);
  const { followUps } = useFollowUps(studentId);
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

  const derived = React.useMemo(
    () =>
      deriveStudentPlan({
        student,
        session,
        input,
        followUps,
        foods: curatedFoods,
        macroParams,
        variant,
        directive,
        edits,
        mealsPerDayOverride,
      }) ?? { strategy: null, macros: null, scores: null, plan: null, mealsPerDay: null },
    [student, session, input, followUps, macroParams, variant, directive, edits, mealsPerDayOverride],
  );

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
    edits,
    setMealsPerDay,
    ...derived,
  };
}
