"use client";

import * as React from "react";

import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { useFollowUps } from "@/modules/follow-ups/hooks/use-follow-ups";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import {
  buildNutritionistOpinion,
  buildOpinionInput,
  type NutritionistOpinion,
} from "@/modules/meal-plan/services/nutritionistOpinion";

/**
 * O Parecer do Nutricionista de um aluno, reativo e determinístico. Reúne os
 * mesmos motores da Estratégia, do Diagnóstico, do Cardápio e da Memória (sem
 * duplicar regra) via `buildOpinionInput` — o mesmo montador do Documento
 * Premium, para o parecer ser idêntico nos dois.
 */
export function useNutritionistOpinion(studentId: string): NutritionistOpinion | null {
  const { student, session, input, strategy, macros, scores, plan, directive } =
    useStudentPlan(studentId);
  const macroParams = useMacroParams();
  const { record } = useStrategyInput(studentId);
  const { followUps } = useFollowUps(studentId);

  return React.useMemo(() => {
    if (!student?.mainGoal || !session || !input || !strategy || !macros || !scores || !plan || !record) {
      return null;
    }
    return buildNutritionistOpinion(
      buildOpinionInput({
        student,
        answers: session.answers,
        strategyInput: input,
        strategy,
        macros,
        scores,
        plan,
        followUps,
        directive,
        macroParams,
        startDate: record.createdAt.slice(0, 10),
      }),
    );
  }, [student, session, input, strategy, macros, scores, plan, directive, macroParams, record, followUps]);
}
