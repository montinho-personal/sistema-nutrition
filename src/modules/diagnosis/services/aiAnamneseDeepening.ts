/**
 * Camada de IA da anamnese (híbrida — Workflow V1). A entrevista determinística
 * é a base; aqui a IA revisa o que já foi respondido e sugere as perguntas de
 * aprofundamento de maior peso clínico. Reaproveita a chamada crua à Anthropic
 * do recordatório (a chave é secreta, só no servidor).
 */

import { z } from "zod";

import { anamneseDeepeningPrompt } from "@/prompts/anamneseDeepening";
import { buildAnamnesePortrait } from "@/modules/diagnosis/services/anamnesePortrait";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { StudentGoal } from "@/modules/students/types";
import type { AnswerMap } from "@/modules/diagnosis/types";

export interface DeepeningQuestion {
  id: string;
  topic: string;
  question: string;
  why: string;
}

const responseSchema = z.object({
  questions: z
    .array(
      z.object({
        topic: z.string().min(1).max(60),
        question: z.string().min(1).max(300),
        why: z.string().min(1).max(300),
      }),
    )
    .max(5),
});

/** Resumo textual do que a anamnese já capturou (para a IA achar as lacunas). */
function summarize(answers: AnswerMap): string {
  const groups = buildAnamnesePortrait(answers);
  if (groups.length === 0) return "nenhum dado relevante ainda.";
  return groups
    .map((g) => `${g.title}: ${g.items.map((i) => `${i.label} = ${i.value}`).join("; ")}`)
    .join("\n");
}

/** Preenche o template centralizado com o resumo da anamnese. */
export function renderAnamneseDeepeningPrompt(
  answers: AnswerMap,
  goal: StudentGoal | null,
): string {
  const fills: Record<string, string> = {
    goal: goal ? STUDENT_GOAL_LABELS[goal] : "não definido",
    summary: summarize(answers),
  };
  return Object.entries(fills).reduce<string>(
    (tpl, [k, v]) => tpl.replaceAll(`{{${k}}}`, v),
    anamneseDeepeningPrompt.template,
  );
}

/** Extrai e valida as perguntas de aprofundamento do texto da IA (ou null). */
export function parseDeepeningResponse(text: string): DeepeningQuestion[] | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return null;

  return parsed.data.questions.map((q, i) => ({
    id: `deep_${i}`,
    topic: q.topic,
    question: q.question,
    why: q.why,
  }));
}
