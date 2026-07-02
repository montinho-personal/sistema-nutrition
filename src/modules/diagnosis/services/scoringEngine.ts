/**
 * Motor de scores do diagnóstico (Documento 06 — Motor de Scores).
 *
 * Determinístico e auditável: soma as contribuições das respostas sobre a
 * linha de base e limita a 0–100. Nenhuma IA envolvida (Documento 08).
 */

import { INVERTED_SCORES, SCORE_BASELINE } from "@/modules/diagnosis/constants";
import { QUESTIONS, visibleQuestions } from "@/modules/diagnosis/constants/questionnaire";
import type { AnswerMap, DiagnosisScore, ScoreDelta, ScoreKey } from "@/modules/diagnosis/types";

const ALL_KEYS = Object.keys(SCORE_BASELINE) as ScoreKey[];

function addDelta(acc: Record<ScoreKey, number>, delta: ScoreDelta | undefined, factor = 1) {
  if (!delta) return;
  for (const key of Object.keys(delta) as ScoreKey[]) {
    acc[key] += (delta[key] ?? 0) * factor;
  }
}

/** Regras específicas para respostas numéricas (ex.: sono). */
function applyNumericRules(acc: Record<ScoreKey, number>, answers: AnswerMap) {
  const sleep = answers.sleep_hours;
  if (typeof sleep === "number") {
    if (sleep < 6) addDelta(acc, { adherence: -8, consistency: -8, hungerControl: -5 });
    else if (sleep >= 7) addDelta(acc, { consistency: 5 });
  }
}

/** Computa o mapa de scores (0–100) a partir das respostas. */
export function computeScoreMap(answers: AnswerMap): Record<ScoreKey, number> {
  const acc: Record<ScoreKey, number> = { ...SCORE_BASELINE };

  for (const question of QUESTIONS) {
    const answer = answers[question.key];
    if (answer === undefined || answer === null) continue;

    if (question.type === "single" && typeof answer === "string") {
      const option = question.options?.find((o) => o.value === answer);
      addDelta(acc, option?.scores);
    } else if (question.type === "multi" && Array.isArray(answer)) {
      for (const value of answer) {
        const option = question.options?.find((o) => o.value === value);
        addDelta(acc, option?.scores);
      }
    } else if (question.type === "scale" && typeof answer === "number" && question.scale) {
      const span = question.scale.max - question.scale.min || 1;
      const ratio = Math.max(0, Math.min(1, (answer - question.scale.min) / span));
      addDelta(acc, question.scores, ratio);
    }
  }

  applyNumericRules(acc, answers);

  for (const key of ALL_KEYS) {
    acc[key] = Math.max(0, Math.min(100, Math.round(acc[key])));
  }
  return acc;
}

/** Computa os scores como lista, marcando os invertidos (maior = pior). */
export function computeScores(answers: AnswerMap): DiagnosisScore[] {
  const map = computeScoreMap(answers);
  return ALL_KEYS.map((key) => ({
    key,
    score: map[key],
    invert: INVERTED_SCORES.includes(key),
  }));
}

/**
 * Confiança geral do diagnóstico (0–100): proporção das perguntas
 * *aplicáveis* que foram respondidas (Documento 03B — grau de confiança).
 * As condicionais só entram na conta quando de fato aparecem — uma pergunta
 * que nunca foi mostrada não pode derrubar a confiança.
 */
export function computeOverallConfidence(answers: AnswerMap): number {
  const applicable = visibleQuestions(answers);
  const total = applicable.length || 1;
  const answered = applicable.filter((q) => {
    const a = answers[q.key];
    return a !== undefined && a !== null && !(Array.isArray(a) && a.length === 0) && a !== "";
  }).length;
  return Math.round((answered / total) * 100);
}
