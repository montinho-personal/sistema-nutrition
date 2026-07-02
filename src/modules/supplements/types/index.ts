/**
 * Tipos do Banco Inteligente de Suplementação (Documento 03G — Biblioteca 3).
 *
 * Suplementos nunca são protagonistas: cada um carrega qual problema resolve e
 * a alternativa alimentar, sempre avaliada primeiro (Documentos 00/04, Etapa 10).
 */

export type SupplementEvidence = "strong" | "moderate" | "limited";
export type CostBenefit = "low" | "medium" | "high";

/**
 * Situação de um suplemento para o aluno:
 * - recommended: uma dificuldade concreta o justifica.
 * - consider: pode ajudar, mas custo/abertura pedem cautela.
 * - not_needed: nenhuma dificuldade atual o justifica.
 * - not_indicated: o aluno prefere resolver só pela comida.
 */
export type SupplementStatus = "recommended" | "consider" | "not_needed" | "not_indicated";

/** Um suplemento do catálogo (espelha montinho.supplements). */
export interface Supplement {
  id: string;
  name: string;
  objective: string;
  /** Qual problema resolve — pergunta obrigatória (Documento 00). */
  problemSolved: string;
  mechanism: string;
  usualDose: string;
  timing: string;
  /** Alternativa alimentar — sempre avaliada antes do suplemento. */
  foodAlternatives: string;
  expectedImpact: string;
  evidence: SupplementEvidence;
  costBenefit: CostBenefit;
  /** Menor número = maior prioridade estratégica. */
  priority: number;
}

/** Recomendação avaliada para um aluno. */
export interface SupplementRecommendation {
  supplement: Supplement;
  status: SupplementStatus;
  /** Justificativa: qual dificuldade (ou por que não é necessário). */
  reason: string;
}

/** Contexto do aluno para a decisão (do diagnóstico + estratégia). */
export interface SupplementContext {
  trains: string | null;
  hungerControl: number;
  practicality: number;
  restrictions: string[];
  healthConditions: string[];
  sleepHours: number | null;
  mealsOut: string | null;
  budgetTight: boolean;
  /** Abertura a suplementos: sim | depende | nao. */
  openness: string | null;
}
