/**
 * Motor de Resumo Executivo (Documento 06 — Motor de Resumo).
 *
 * Sintetiza scores, hipóteses e respostas em um retrato estratégico do
 * aluno. Determinístico — o "Resumo Inteligente" do Documento 05.
 */

import { SCORE_LABELS } from "@/modules/diagnosis/constants";
import { computeScoreMap } from "@/modules/diagnosis/services/scoringEngine";
import { computeHypotheses } from "@/modules/diagnosis/services/hypothesisEngine";
import type { AnswerMap, ExecutiveSummary, ScoreKey } from "@/modules/diagnosis/types";

export interface StudentSummaryContext {
  goalLabel: string | null;
  ageYears: number | null;
}

/** Estratégias promissoras derivadas dos scores (regras, Documento 08). */
function promisingStrategies(scores: Record<ScoreKey, number>): string[] {
  const suggestions: { when: boolean; text: string }[] = [
    {
      when: scores.flexibility <= 40,
      text: "Estratégia flexível, para evitar o padrão tudo-ou-nada.",
    },
    {
      when: scores.hungerControl <= 45,
      text: "Foco em saciedade: alta proteína, fibras e maior volume alimentar.",
    },
    {
      when: scores.practicality <= 45,
      text: "Praticidade no centro: marmitas e preparo antecipado.",
    },
    {
      when: scores.financial <= 40,
      text: "Alimentos de baixo custo e alto custo-benefício.",
    },
    {
      when: scores.organization <= 45,
      text: "Um ritual simples de planejamento e compras semanais.",
    },
    {
      when: scores.environment <= 45,
      text: "Ajuste do ambiente alimentar em casa antes de restringir.",
    },
    {
      when: scores.motivation >= 70,
      text: "Aproveitar a motivação atual com pequenas vitórias rápidas.",
    },
    {
      when: scores.consistency >= 70 && scores.adherence >= 65,
      text: "Um plano mais estruturado, apoiado na boa disciplina.",
    },
  ];
  const picked = suggestions.filter((s) => s.when).map((s) => s.text);
  return picked.length > 0
    ? picked.slice(0, 4)
    : ["Começar simples, consolidar o hábito e ajustar com os acompanhamentos."];
}

function buildProfile(scores: Record<ScoreKey, number>, context: StudentSummaryContext): string {
  const parts: string[] = [];
  if (context.ageYears) parts.push(`${context.ageYears} anos`);
  if (context.goalLabel) parts.push(`objetivo de ${context.goalLabel.toLowerCase()}`);

  const strengths = (Object.keys(scores) as ScoreKey[])
    .filter((k) => k !== "abandonmentRisk" && scores[k] >= 70)
    .map((k) => SCORE_LABELS[k].toLowerCase());
  const weaknesses = (Object.keys(scores) as ScoreKey[])
    .filter((k) => k !== "abandonmentRisk" && scores[k] <= 40)
    .map((k) => SCORE_LABELS[k].toLowerCase());

  let sentence = parts.length ? `Aluno com ${parts.join(", ")}.` : "Aluno.";
  if (strengths.length) sentence += ` Pontos fortes: ${strengths.slice(0, 3).join(", ")}.`;
  if (weaknesses.length) sentence += ` Pontos de atenção: ${weaknesses.slice(0, 3).join(", ")}.`;
  return sentence;
}

/** Monta o resumo executivo completo. */
export function buildExecutiveSummary(
  answers: AnswerMap,
  context: StudentSummaryContext,
): ExecutiveSummary {
  const scores = computeScoreMap(answers);
  const hypotheses = computeHypotheses(answers);

  const difficulty = hypotheses.find((h) => h.dimension === "difficulty" || h.dimension === "risk");
  const opportunity = hypotheses.find(
    (h) => h.dimension === "opportunity" || h.dimension === "advantage",
  );
  const risks = hypotheses.filter((h) => h.dimension === "risk").map((h) => h.title);

  return {
    profile: buildProfile(scores, context),
    mainDifficulty: difficulty?.title ?? null,
    mainOpportunity: opportunity?.title ?? null,
    topRisks: risks.slice(0, 3),
    promisingStrategies: promisingStrategies(scores),
  };
}

/** Idade em anos a partir de uma data ISO (ou null). */
export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}
