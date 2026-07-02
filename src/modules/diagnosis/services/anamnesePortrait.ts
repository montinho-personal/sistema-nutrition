/**
 * Retrato da anamnese (Documento 05 — do inteligente ao detalhe).
 *
 * Traduz as respostas cruas — recordatório alimentar, gatilhos, preferências —
 * em grupos legíveis para o treinador. Determinístico: apenas resolve rótulos
 * a partir do próprio questionário (nenhuma IA — Documento 08).
 */

import { QUESTIONS } from "@/modules/diagnosis/constants/questionnaire";
import type { AnswerMap, AnswerValue } from "@/modules/diagnosis/types";

export interface PortraitItem {
  label: string;
  value: string;
}
export interface PortraitGroup {
  title: string;
  items: PortraitItem[];
}

const QUESTION_BY_KEY = new Map(QUESTIONS.map((q) => [q.key, q]));

/** Converte o valor de uma resposta no texto que o aluno de fato escolheu. */
function readable(key: string, value: AnswerValue): string | null {
  if (value === null || value === undefined) return null;
  const question = QUESTION_BY_KEY.get(key);
  if (!question) return null;

  if (Array.isArray(value)) {
    const labels = value
      .map((v) => question.options?.find((o) => o.value === v)?.label ?? v)
      .filter(Boolean);
    return labels.length ? labels.join(", ") : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Texto livre não tem opções — devolve o próprio texto.
    if (!question.options) return trimmed;
    return question.options.find((o) => o.value === trimmed)?.label ?? trimmed;
  }
  return String(value);
}

/** Monta um grupo a partir de uma lista de [chave, rótulo], omitindo vazios. */
function group(title: string, entries: [key: string, label: string][], a: AnswerMap): PortraitGroup {
  const items: PortraitItem[] = [];
  for (const [key, label] of entries) {
    const value = readable(key, a[key]);
    if (value) items.push({ label, value });
  }
  return { title, items };
}

/**
 * Retrato completo em grupos. Só entram os grupos que têm ao menos um dado —
 * o resumo nunca mostra seções vazias.
 */
export function buildAnamnesePortrait(answers: AnswerMap): PortraitGroup[] {
  const groups = [
    group(
      "Dia alimentar",
      [
        ["meals_per_day", "Refeições por dia"],
        ["breakfast", "Café da manhã"],
        ["lunch", "Almoço"],
        ["dinner", "Jantar"],
        ["snacks", "Beliscos"],
        ["night_food", "Come à noite"],
        ["water_intake", "Água"],
        ["beverages", "Bebidas"],
        ["alcohol_frequency", "Álcool"],
      ],
      answers,
    ),
    group(
      "Preferências e restrições",
      [
        ["favorite_foods", "Não abre mão"],
        ["disliked_foods", "Não come"],
        ["restrictions", "Restrições"],
        ["restrictions_other", "Detalhe da restrição"],
      ],
      answers,
    ),
    group(
      "Saúde",
      [
        ["health_conditions", "Condições"],
        ["health_other", "Detalhe"],
        ["diabetes_med", "Medicação (diabetes)"],
      ],
      answers,
    ),
    group(
      "Gatilhos e histórico",
      [
        ["compulsion_trigger", "Gatilhos de compulsão"],
        ["sweets_timing", "Vontade de doce"],
        ["regain_trigger", "O que fazia o peso voltar"],
        ["diet_blocker", "O que mais atrapalhou antes"],
      ],
      answers,
    ),
  ];
  return groups.filter((g) => g.items.length > 0);
}
