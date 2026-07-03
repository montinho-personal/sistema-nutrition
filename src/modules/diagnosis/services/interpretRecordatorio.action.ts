"use server";

/**
 * Server action do enriquecimento por IA do recordatório (V2).
 *
 * Roda só no servidor: a chave secreta nunca chega ao cliente. Degrada com
 * elegância — sem chave devolve "unavailable"; qualquer falha vira "error" e a
 * UI segue com a análise determinística (que é o padrão e o fallback).
 */

import { isAiConfigured } from "@/config/env";
import { logger } from "@/shared/services/logger";
import {
  callAnthropic,
  parseAiResponse,
  renderRecordatorioPrompt,
} from "@/modules/diagnosis/services/aiRecordatorio";
import { analyzeRecordatorio } from "@/modules/diagnosis/services/recordatorioAnalysis";
import type { AnswerMap } from "@/modules/diagnosis/types";
import type { RecordatorioObservation } from "@/modules/diagnosis/services/recordatorioAnalysis";

export type AiInterpretResult =
  | { status: "unavailable" }
  | { status: "error" }
  | { status: "ok"; observations: RecordatorioObservation[] };

export async function interpretRecordatorioAction(
  answers: AnswerMap,
): Promise<AiInterpretResult> {
  if (!isAiConfigured) return { status: "unavailable" };

  try {
    // Passa à IA o que a regra já concluiu, para ela trazer só o que falta.
    const deterministic = analyzeRecordatorio(answers).observations.map((o) => o.title);
    const prompt = renderRecordatorioPrompt(answers, deterministic);
    const text = await callAnthropic(prompt);
    const observations = parseAiResponse(text);
    if (!observations) return { status: "error" };
    return { status: "ok", observations };
  } catch (error) {
    // Nunca vaza dados de saúde nos logs — só a mensagem do erro.
    logger.warn("Falha ao interpretar o recordatório com IA", {
      message: error instanceof Error ? error.message : "desconhecido",
    });
    return { status: "error" };
  }
}
