/**
 * Camada de IA do recordatório (V2 — enriquecimento opcional).
 *
 * A análise determinística (`recordatorioAnalysis.ts`) resolve a maior parte
 * (Documento 08). Aqui, SÓ quando há chave configurada, a IA lê o texto livre e
 * traz nuances que a regra não captura. Chamada crua à Messages API da Anthropic
 * (sem SDK) — usada apenas no servidor (a chave é secreta).
 */

import { z } from "zod";

import { env } from "@/config/env";
import { recordatorioInterpretationPrompt } from "@/prompts/recordatorioInterpretation";
import type { AnswerMap } from "@/modules/diagnosis/types";
import type { RecordatorioObservation } from "@/modules/diagnosis/services/recordatorioAnalysis";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 20_000;

/** Formato esperado da resposta da IA (validado antes de usar). */
const aiResponseSchema = z.object({
  observations: z
    .array(
      z.object({
        kind: z.enum(["risk", "opportunity", "recommendation"]),
        title: z.string().min(1).max(120),
        detail: z.string().min(1).max(600),
      }),
    )
    .max(6),
});

function value(answers: AnswerMap, key: string): string {
  const raw = answers[key];
  if (Array.isArray(raw)) return raw.join(", ") || "—";
  if (typeof raw === "string") return raw.trim() || "—";
  if (typeof raw === "number") return String(raw);
  return "—";
}

/** Preenche o template centralizado com os dados do recordatório. */
export function renderRecordatorioPrompt(
  answers: AnswerMap,
  deterministicObservations: string[],
): string {
  const fills: Record<string, string> = {
    breakfast: value(answers, "breakfast"),
    lunch: value(answers, "lunch"),
    dinner: value(answers, "dinner"),
    snacks: value(answers, "snacks"),
    goal: value(answers, "goal"),
    mealsPerDay: value(answers, "meals_per_day"),
    waterIntake: value(answers, "water_intake"),
    beverages: value(answers, "beverages"),
    deterministicObservations: deterministicObservations.length
      ? deterministicObservations.join("; ")
      : "nenhuma",
  };
  return Object.entries(fills).reduce<string>(
    (tpl, [k, v]) => tpl.replaceAll(`{{${k}}}`, v),
    recordatorioInterpretationPrompt.template,
  );
}

/** Extrai e valida as observações do texto retornado pela IA (ou null). */
export function parseAiResponse(text: string): RecordatorioObservation[] | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }

  const parsed = aiResponseSchema.safeParse(json);
  if (!parsed.success) return null;

  return parsed.data.observations.map((o, i) => ({
    id: `ai_${i}`,
    kind: o.kind,
    title: o.title,
    detail: o.detail,
  }));
}

/** Chama a Messages API da Anthropic e devolve o texto da resposta. */
export async function callAnthropic(prompt: string): Promise<string> {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("IA não configurada");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Anthropic respondeu ${res.status}`);

  const data: unknown = await res.json();
  const content = (data as { content?: { type?: string; text?: string }[] })?.content;
  const block = Array.isArray(content) ? content.find((b) => b?.type === "text") : null;
  if (!block?.text) throw new Error("Resposta da IA vazia");
  return block.text;
}
