/**
 * Dashboard do Diagnóstico (Workflow V1 — Etapa 2). Regra pura e auditável
 * (Doc 08): IMC, grau de dificuldade do caso, objetivos, estimativas/referências
 * nutricionais e um parecer profissional — tudo derivado do diagnóstico, sem IA.
 */

import {
  DIFFICULTY_BANDS,
  IMC_BANDS,
  NUTRITION_REFERENCE,
  WATER_INTAKE_LITERS,
} from "@/modules/diagnosis/constants/dashboard";
import { SCORE_LABELS } from "@/modules/diagnosis/constants";
import { PROTEIN_G_PER_KG } from "@/modules/strategy/constants/parameters";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { StudentGoal } from "@/modules/students/types";
import type { AnswerMap, ScoreKey } from "@/modules/diagnosis/types";

export type DifficultyLevel = "baixo" | "medio" | "alto";

/** Adjetivo feminino de "dificuldade" para o parecer (pt-BR). */
const DIFFICULTY_WORD: Record<DifficultyLevel, string> = {
  baixo: "baixa",
  medio: "média",
  alto: "alta",
};

export interface DiagnosisDashboardInput {
  answers: AnswerMap;
  scores: Record<ScoreKey, number>;
  goal: StudentGoal | null;
  ageYears: number | null;
  weightKg: number | null;
  heightCm: number | null;
  /** Gasto energético total (TDEE) já calculado, quando há peso. */
  tdee: number | null;
}

export interface DiagnosisDashboard {
  imc: { value: number; label: string } | null;
  difficulty: { level: DifficultyLevel; score: number; reason: string };
  objectives: { main: string | null; secondary: string[] };
  estimates: {
    currentIntakeKcal: number | null;
    proteinG: number | null;
    proteinPerKg: number | null;
    fiberG: number | null;
    recommendedWaterMl: number | null;
    currentWaterL: number | null;
  };
  strengths: string[];
  weaknesses: string[];
  parecer: string;
}

const ALL_KEYS = Object.keys(SCORE_LABELS) as ScoreKey[];

/** Valor "bom" de um score (0–100): o risco de abandono é invertido. */
function goodValue(key: ScoreKey, score: number): number {
  return key === "abandonmentRisk" ? 100 - score : score;
}

function classifyImc(weightKg: number, heightCm: number): { value: number; label: string } | null {
  if (heightCm <= 0) return null;
  const m = heightCm / 100;
  const value = Math.round((weightKg / (m * m)) * 10) / 10;
  const band = IMC_BANDS.find((b) => value < b.max) ?? IMC_BANDS[IMC_BANDS.length - 1];
  return { value, label: band.label };
}

/** Objetivo secundário ancorado no objetivo principal. */
function primarySecondary(goal: StudentGoal | null): string | null {
  switch (goal) {
    case "weight_loss":
      return "preservar a massa magra durante o déficit";
    case "hypertrophy":
      return "maximizar o ganho de massa magra com o mínimo de gordura";
    case "recomposition":
      return "recompor: reduzir gordura preservando o músculo";
    case "maintenance":
      return "estabilizar o peso e consolidar os hábitos";
    case "performance":
      return "sustentar energia e recuperação para o treino";
    case "health":
      return "melhorar marcadores de saúde e a consistência";
    case "event_preparation":
      return "chegar no ponto certo para a data-alvo";
    default:
      return null;
  }
}

export function buildDiagnosisDashboard(input: DiagnosisDashboardInput): DiagnosisDashboard {
  const { answers, scores, goal, ageYears, weightKg, heightCm, tdee } = input;

  // Grau de dificuldade: 100 − capacidade média (maior = mais difícil).
  const meanGood = Math.round(
    ALL_KEYS.reduce((sum, k) => sum + goodValue(k, scores[k]), 0) / ALL_KEYS.length,
  );
  const difficultyScore = Math.max(0, Math.min(100, 100 - meanGood));
  const level: DifficultyLevel =
    difficultyScore < DIFFICULTY_BANDS.baixo
      ? "baixo"
      : difficultyScore < DIFFICULTY_BANDS.medio
        ? "medio"
        : "alto";

  // Pontos fortes e de atenção a partir dos scores.
  const ranked = ALL_KEYS.map((k) => ({ key: k, good: goodValue(k, scores[k]) })).sort(
    (a, b) => b.good - a.good,
  );
  const strengths = ranked
    .filter((r) => r.good >= 60)
    .slice(0, 3)
    .map((r) => SCORE_LABELS[r.key]);
  const weaknesses = ranked
    .filter((r) => r.good <= 45)
    .slice(-3)
    .reverse()
    .map((r) => SCORE_LABELS[r.key]);

  const difficultyReason =
    weaknesses.length > 0
      ? `pesam ${weaknesses.slice(0, 2).map((w) => w.toLowerCase()).join(" e ")}`
      : "boa capacidade geral de execução";

  // Objetivos secundários (objetivo principal + sinais do diagnóstico).
  const secondary: string[] = [];
  const anchor = primarySecondary(goal);
  if (anchor) secondary.push(anchor);
  if (scores.hungerControl < 45) secondary.push("melhorar a saciedade e o controle da fome");
  if (goodValue("abandonmentRisk", scores.abandonmentRisk) < 45)
    secondary.push("sustentar a aderência ao longo do tempo");
  if (scores.environment < 45) secondary.push("organizar o ambiente alimentar");
  if (scores.organization < 45) secondary.push("estruturar a rotina e o planejamento das refeições");
  if (answers.water_intake === "menos_1l") secondary.push("melhorar a hidratação");

  // Estimativas / referências (dependem do peso).
  const imc = weightKg && heightCm ? classifyImc(weightKg, heightCm) : null;
  const proteinPerKg = goal ? PROTEIN_G_PER_KG[goal] : null;
  const proteinG = weightKg && proteinPerKg ? Math.round(proteinPerKg * weightKg) : null;
  const fiberG = tdee ? Math.round((tdee / 1000) * NUTRITION_REFERENCE.fiberGPer1000Kcal) : null;
  const recommendedWaterMl = weightKg ? Math.round(NUTRITION_REFERENCE.waterMlPerKg * weightKg) : null;
  const currentWaterL =
    typeof answers.water_intake === "string"
      ? (WATER_INTAKE_LITERS[answers.water_intake] ?? null)
      : null;

  // Parecer profissional (5–10 frases).
  const goalLabel = goal ? STUDENT_GOAL_LABELS[goal].toLowerCase() : "não definido";
  const sentences: string[] = [];
  sentences.push(
    ageYears
      ? `Aluno de ${ageYears} anos, com objetivo de ${goalLabel}.`
      : `Aluno com objetivo de ${goalLabel}.`,
  );
  if (imc) sentences.push(`O IMC de ${imc.value} indica ${imc.label.toLowerCase()}.`);
  if (tdee)
    sentences.push(
      `O gasto energético total estimado é de ${tdee} kcal/dia — base para as calorias-alvo da estratégia.`,
    );
  sentences.push(
    `O caso é classificado como de dificuldade ${DIFFICULTY_WORD[level]}, pois ${difficultyReason}.`,
  );
  if (strengths.length > 0)
    sentences.push(`A favor, destacam-se ${strengths.map((s) => s.toLowerCase()).join(", ")}.`);
  if (weaknesses.length > 0)
    sentences.push(
      `Como pontos de atenção, ${weaknesses.map((w) => w.toLowerCase()).join(", ")} exigem estratégia específica.`,
    );
  if (secondary.length > 1)
    sentences.push(`Além do objetivo principal, a estratégia deve ${secondary[1]}.`);
  sentences.push(
    level === "alto"
      ? "Dada a dificuldade elevada, recomenda-se um ritmo conservador, com metas pequenas e frequentes para proteger a aderência."
      : level === "medio"
        ? "Um ritmo moderado, com acompanhamento próximo dos pontos de atenção, tende a equilibrar resultado e aderência."
        : "A boa capacidade geral permite uma estratégia estruturada, com margem para um ritmo um pouco mais firme.",
  );

  return {
    imc,
    difficulty: { level, score: difficultyScore, reason: difficultyReason },
    objectives: { main: goal ? STUDENT_GOAL_LABELS[goal] : null, secondary: secondary.slice(0, 4) },
    estimates: {
      currentIntakeKcal: tdee,
      proteinG,
      proteinPerKg,
      fiberG,
      recommendedWaterMl,
      currentWaterL,
    },
    strengths,
    weaknesses,
    parecer: sentences.join(" "),
  };
}
