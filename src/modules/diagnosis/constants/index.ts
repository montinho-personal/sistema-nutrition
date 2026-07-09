import type { ScoreKey } from "@/modules/diagnosis/types";

/** Linha de base de cada score antes de aplicar as respostas. */
export const SCORE_BASELINE: Record<ScoreKey, number> = {
  adherence: 50,
  organization: 50,
  motivation: 50,
  consistency: 50,
  hungerControl: 50,
  practicality: 50,
  financial: 50,
  environment: 50,
  flexibility: 50,
  abandonmentRisk: 30,
};

/** Scores cuja leitura é invertida (maior = pior). */
export const INVERTED_SCORES: ScoreKey[] = ["abandonmentRisk"];

/**
 * Faixas de sanidade da antropometria da anamnese (Documento 08 — nenhum
 * número mágico). Fora da faixa, a resposta é tratada como ausente — um erro
 * de digitação (peso "8200") nunca contamina o cálculo dos macros.
 */
export const ANTHROPOMETRY_LIMITS = {
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 100, max: 250 },
  ageYears: { min: 10, max: 100 },
} as const;

/** Rótulos pt-BR dos scores. */
export const SCORE_LABELS: Record<ScoreKey, string> = {
  adherence: "Aderência",
  organization: "Organização",
  motivation: "Motivação",
  consistency: "Consistência",
  hungerControl: "Controle da fome",
  practicality: "Praticidade da rotina",
  financial: "Folga financeira",
  environment: "Ambiente alimentar",
  flexibility: "Flexibilidade",
  abandonmentRisk: "Risco de abandono",
};

/** Scores destacados no painel de inteligência (ordem de exibição). */
export const HIGHLIGHTED_SCORES: ScoreKey[] = [
  "adherence",
  "abandonmentRisk",
  "motivation",
  "organization",
];
