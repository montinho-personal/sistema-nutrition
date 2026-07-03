"use server";

/**
 * Server action do aprofundamento da anamnese por IA (híbrida — Workflow V1).
 *
 * Roda só no servidor: a chave secreta nunca chega ao cliente. Degrada com
 * elegância — sem chave, "unavailable"; qualquer falha vira "error" e a
 * anamnese determinística segue completa (é a base e o fallback). Logs nunca
 * carregam dados sensíveis do aluno.
 */

import { isAiConfigured } from "@/config/env";
import { logger } from "@/shared/services/logger";
import { callAnthropic } from "@/modules/diagnosis/services/aiRecordatorio";
import {
  parseDeepeningResponse,
  renderAnamneseDeepeningPrompt,
  type DeepeningQuestion,
} from "@/modules/diagnosis/services/aiAnamneseDeepening";
import type { StudentGoal } from "@/modules/students/types";
import type { AnswerMap } from "@/modules/diagnosis/types";

export type DeepenResult =
  | { status: "unavailable" }
  | { status: "error" }
  | { status: "ok"; questions: DeepeningQuestion[] };

export async function deepenAnamneseAction(
  answers: AnswerMap,
  goal: StudentGoal | null,
): Promise<DeepenResult> {
  if (!isAiConfigured) return { status: "unavailable" };

  try {
    const prompt = renderAnamneseDeepeningPrompt(answers, goal);
    const text = await callAnthropic(prompt);
    const questions = parseDeepeningResponse(text);
    if (!questions) return { status: "error" };
    return { status: "ok", questions };
  } catch (error) {
    logger.warn("Falha ao aprofundar a anamnese com IA", {
      message: error instanceof Error ? error.message : "desconhecido",
    });
    return { status: "error" };
  }
}
