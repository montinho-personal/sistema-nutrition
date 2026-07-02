/**
 * Parâmetros da decisão de suplementação (Documento 08 — nenhum número mágico).
 */

import type {
  CostBenefit,
  SupplementEvidence,
  SupplementStatus,
} from "@/modules/supplements/types";

/** Horas de sono abaixo das quais o sono é considerado curto. */
export const SLEEP_SHORT_HOURS = 6;

/** Ordem de exibição por situação (menor = aparece antes). */
export const STATUS_ORDER: Record<SupplementStatus, number> = {
  recommended: 0,
  consider: 1,
  not_indicated: 2,
  not_needed: 3,
};

/** Rótulos pt-BR das situações. */
export const STATUS_LABELS: Record<SupplementStatus, string> = {
  recommended: "Recomendado",
  consider: "Avaliar",
  not_needed: "Não necessário",
  not_indicated: "Não indicado agora",
};

/** Rótulos pt-BR do nível de evidência. */
export const EVIDENCE_LABELS: Record<SupplementEvidence, string> = {
  strong: "Evidência forte",
  moderate: "Evidência moderada",
  limited: "Evidência limitada",
};

/** Rótulos pt-BR do custo-benefício. */
export const COST_BENEFIT_LABELS: Record<CostBenefit, string> = {
  low: "Custo-benefício baixo",
  medium: "Custo-benefício médio",
  high: "Custo-benefício alto",
};
