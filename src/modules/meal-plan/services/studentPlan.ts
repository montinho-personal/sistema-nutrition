/**
 * Cadeia Diagnóstico → Estratégia → Macros → Cardápio (com instrução e edições)
 * — pura e determinística.
 *
 * Fonte ÚNICA da derivação do plano de um aluno: o hook `useStudentPlan`
 * (quadro do cardápio, Parecer, Documento Premium, Validação) e o
 * `buildStudentReport` (Relatório) chamam ESTA função. O cardápio que o
 * treinador vê e edita é exatamente o que sai no relatório — nunca duas contas
 * diferentes (Documento 17 — reutilizar, nunca duplicar).
 */

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
import type {
  MacroContext,
  MacroParams,
  MacroTargets,
  NutritionStrategy,
  StrategyInput,
} from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import { summarizeAdherenceSignals } from "@/modules/follow-ups/services";
import type { Food } from "@/modules/foods/types";
import { buildMealPlan, type MealPlanContext } from "./mealPlanEngine";
import { applyDirective, applyDirectiveToMacros } from "./mealPlanDirective";
import { applyPlanEdits } from "./mealPlanEdits";
import type {
  EditedMealPlan,
  MealPlanDirective,
  MealPlanEdits,
} from "@/modules/meal-plan/types";

export interface StudentPlanSources {
  student: Student | null;
  session: DiagnosisSession | null;
  /** Entrada da estratégia (peso, meta, ajustes) — `record.input` no Relatório. */
  input: StrategyInput | null;
  followUps: FollowUp[];
  foods: Food[];
  macroParams: MacroParams;
  /** Preferências persistidas do cardápio (variante, instrução, edições). */
  variant: number;
  directive: MealPlanDirective;
  edits: MealPlanEdits | null;
}

export interface DerivedStudentPlan {
  scores: Record<ScoreKey, number>;
  strategy: NutritionStrategy;
  macros: MacroTargets;
  mealsPerDay: number;
  /** O cardápio final: motor + instrução do treinador + edições manuais. */
  plan: EditedMealPlan;
}

/**
 * Deriva o plano completo do aluno. Retorna null se a cadeia mínima estiver
 * incompleta (diagnóstico concluído + objetivo + estratégia com peso).
 */
export function deriveStudentPlan(src: StudentPlanSources): DerivedStudentPlan | null {
  const { student, session, input } = src;
  if (!student?.mainGoal || !session || session.status !== "completed" || !input) return null;

  const goal = student.mainGoal;
  const answers = session.answers;
  const scores = computeScoreMap(answers);
  const strategy = buildStrategy(goal, scores, answers);

  const macroCtx: MacroContext = {
    weightKg: input.currentWeightKg,
    bodyFatPct: input.bodyFatPct,
    heightCm: student.heightCm,
    ageYears: ageFromBirthDate(student.birthDate),
    sex: student.sex,
    activity: (answers.activity as string | undefined) ?? null,
    trains: (answers.trains as string | undefined) ?? null,
    ...readTrainingContext(answers),
  };
  const resolvedMacros = resolveMacros(goal, strategy, macroCtx, src.macroParams, input);
  // A instrução do treinador ("1800 kcal") vale para TODOS os números exibidos:
  // os cards de Macros mostram a MESMA conta que o cardápio segue.
  const macros = applyDirectiveToMacros(resolvedMacros, src.directive);
  const approach = resolveDietApproach(input.dietApproach ?? null, goal);
  const mealsPerDay = approach.meals ?? strategy.mealsPerDay;

  // Memória de aderência: adaptações SEGURAS do histórico moldam o cardápio.
  const memorySignals = summarizeAdherenceSignals(src.followUps);
  const restrictions = Array.isArray(answers.restrictions)
    ? (answers.restrictions as string[])
    : [];

  // O contexto parte dos macros da estratégia; o `applyDirective` aplica a
  // mesma sobrescrita de calorias — alvo do cardápio ≡ cards de Macros.
  const baseCtx: MealPlanContext = {
    goal,
    mealsPerDay,
    macros: {
      kcal: resolvedMacros.calories,
      protein: resolvedMacros.proteinG,
      carbs: resolvedMacros.carbG,
      fat: resolvedMacros.fatG,
    },
    // A anamnese OU o histórico de acompanhamentos podem pedir a adaptação.
    emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low || memorySignals.emphasizeSatiety,
    emphasizePracticality:
      scores.practicality <= SCORE_THRESHOLDS.low || memorySignals.emphasizePracticality,
    budgetTight: answers.budget === "apertado",
    restrictions,
    variant: src.variant,
    habitualFoodIds: extractHabitualFoodIds(answers),
  };
  // A instrução do treinador ajusta o contexto — a estratégia continua a base.
  const ctx = applyDirective(baseCtx, src.directive);
  // E as edições manuais têm a palavra final sobre o cardápio gerado.
  const plan = applyPlanEdits(buildMealPlan(src.foods, ctx), src.edits, src.foods);

  return { scores, strategy, macros, mealsPerDay, plan };
}
