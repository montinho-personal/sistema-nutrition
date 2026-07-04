"use client";

import * as React from "react";

import {
  ageFromBirthDate,
  buildExecutiveSummary,
  extractHabitualFoodIds,
  readTrainingContext,
} from "@/modules/diagnosis/services";
import {
  computeEnergyBreakdown,
  evaluateStrategyAlerts,
  projectGoal,
  resolveDietApproach,
} from "@/modules/strategy/services";
import { SCORE_THRESHOLDS } from "@/modules/strategy/constants/parameters";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { MacroContext } from "@/modules/strategy/types";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import {
  buildNutritionistOpinion,
  type NutritionistOpinion,
} from "@/modules/meal-plan/services/nutritionistOpinion";

/**
 * O Parecer do Nutricionista de um aluno, reativo e determinístico. Reúne os
 * mesmos motores da Estratégia, do Diagnóstico e do Cardápio (sem duplicar
 * regra) e os entrega como um raciocínio individualizado.
 */
export function useNutritionistOpinion(studentId: string): NutritionistOpinion | null {
  const { student, session, input, strategy, macros, scores, plan, restrictions, directive } =
    useStudentPlan(studentId);
  const macroParams = useMacroParams();

  return React.useMemo(() => {
    if (!student?.mainGoal || !session || !input || !strategy || !macros || !scores || !plan) {
      return null;
    }
    const goal = student.mainGoal;
    const answers = session.answers;
    const ageYears = ageFromBirthDate(student.birthDate);
    const goalLabel = STUDENT_GOAL_LABELS[goal];

    const macroCtx: MacroContext = {
      weightKg: input.currentWeightKg,
      bodyFatPct: input.bodyFatPct,
      heightCm: student.heightCm,
      ageYears,
      sex: student.sex,
      activity: (answers.activity as string | undefined) ?? null,
      trains: (answers.trains as string | undefined) ?? null,
      ...readTrainingContext(answers),
    };
    const energy = computeEnergyBreakdown(macroCtx);
    const trainsRegularly = answers.trains === "regular";

    const projection =
      strategy.direction !== "manutencao" && input.targetChangeKg && input.targetWeeks
        ? projectGoal({
            currentWeightKg: input.currentWeightKg,
            targetChangeKg: input.targetChangeKg,
            weeks: input.targetWeeks,
            direction: strategy.direction,
            velocity: strategy.velocity,
            tdee: macros.tdee,
            prescribedDeltaPct:
              strategy.direction === "deficit"
                ? macroParams.velocityDeficitPct[strategy.velocity]
                : macroParams.velocitySurplusPct[strategy.velocity],
            trainsRegularly,
            proteinAdequate: macroParams.proteinGPerKg[goal] >= 1.6,
            capacity: scores.adherence + scores.consistency - scores.abandonmentRisk,
          })
        : null;

    const summary = buildExecutiveSummary(answers, { goalLabel, ageYears });
    const alerts = evaluateStrategyAlerts({
      calories: macros.calories,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      tdee: macros.tdee,
      weightKg: input.currentWeightKg,
      direction: strategy.direction,
      trainsRegularly,
    });

    const habitualIds = new Set(extractHabitualFoodIds(answers));
    const planFoodIds = new Set(plan.meals.flatMap((m) => m.items.map((it) => it.foodId)));
    const habitualInPlan = [...habitualIds].filter((id) => planFoodIds.has(id)).length;

    return buildNutritionistOpinion({
      student,
      goalLabel,
      weightKg: input.currentWeightKg,
      strategy,
      dietApproachLabel: resolveDietApproach(input.dietApproach ?? null, goal).label,
      macros,
      energy,
      projection,
      summary,
      alerts,
      plan,
      scores,
      directive,
      restrictions,
      habitualInPlan,
      trainsRegularly,
      emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low,
      emphasizePracticality: scores.practicality <= SCORE_THRESHOLDS.low,
      budgetTight: answers.budget === "apertado",
    });
  }, [student, session, input, strategy, macros, scores, plan, restrictions, directive, macroParams]);
}
