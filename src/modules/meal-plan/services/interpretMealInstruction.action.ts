"use server";

/**
 * Server action da interpretação da instrução do treinador (Personal Nutrition
 * AI — Fatia A.2).
 *
 * Roda só no servidor: a chave secreta nunca chega ao cliente. Degrada com
 * elegância — sem chave ou em qualquer falha, devolve a interpretação
 * determinística (que é a base e o fallback). O determinístico é soberano nos
 * números; a IA só complementa. Logs nunca carregam dados sensíveis do aluno.
 */

import { isAiConfigured } from "@/config/env";
import { logger } from "@/shared/services/logger";
import { callAnthropic } from "@/modules/diagnosis/services/aiRecordatorio";
import {
  mergeDirectives,
  parseDirective,
} from "@/modules/meal-plan/services/mealPlanDirective";
import {
  parseInstructionResponse,
  renderMealInstructionPrompt,
} from "@/modules/meal-plan/services/aiMealInstruction";
import type { MealPlanDirective } from "@/modules/meal-plan/types";

export type InterpretResult = {
  /** Origem final: só regra, enriquecido por IA, ou fallback após erro. */
  status: "deterministic" | "ai" | "error";
  directive: MealPlanDirective;
};

export async function interpretMealInstructionAction(instruction: string): Promise<InterpretResult> {
  const deterministic = parseDirective(instruction);
  if (!isAiConfigured || !instruction.trim()) {
    return { status: "deterministic", directive: deterministic };
  }

  try {
    const prompt = renderMealInstructionPrompt(instruction, deterministic.recognized);
    const text = await callAnthropic(prompt);
    const ai = parseInstructionResponse(text);
    if (!ai) return { status: "deterministic", directive: deterministic };
    return { status: "ai", directive: mergeDirectives(deterministic, ai) };
  } catch (error) {
    logger.warn("Falha ao interpretar a instrução do treinador com IA", {
      message: error instanceof Error ? error.message : "desconhecido",
    });
    return { status: "error", directive: deterministic };
  }
}
