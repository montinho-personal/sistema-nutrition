/**
 * Tipos do Módulo 1 — Diagnóstico Estratégico (Documentos 03A, 03B, 06, 07).
 */

/** Scores do diagnóstico (Documento 06). Todos "quanto maior, melhor",
 *  exceto `abandonmentRisk` (quanto maior, pior). */
export type ScoreKey =
  | "adherence"
  | "organization"
  | "motivation"
  | "consistency"
  | "hungerControl"
  | "practicality"
  | "financial"
  | "environment"
  | "flexibility"
  | "abandonmentRisk";

export type AnswerValue = string | string[] | number | null;
export type AnswerMap = Record<string, AnswerValue>;

/** Contribuição de pontos por score (deltas somados sobre a linha de base). */
export type ScoreDelta = Partial<Record<ScoreKey, number>>;

export type QuestionType = "single" | "multi" | "scale" | "number" | "text";

export interface QuestionOption {
  value: string;
  label: string;
  scores?: ScoreDelta;
}

export interface Question {
  key: string;
  block: string;
  label: string;
  help?: string;
  type: QuestionType;
  options?: QuestionOption[];
  /** Escala: rótulos e limites. */
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
  /** Escala/número: contribuição aplicada proporcionalmente ao valor. */
  scores?: ScoreDelta;
  unit?: string;
  placeholder?: string;
  optional?: boolean;
  /** Visibilidade condicional a partir das respostas anteriores. */
  showIf?: (answers: AnswerMap) => boolean;
}

export interface Stage {
  id: string;
  title: string;
  description: string;
}

/** Um score computado, com rótulo qualitativo. */
export interface DiagnosisScore {
  key: ScoreKey;
  score: number;
  invert: boolean;
}

/** Hipótese gerada pelo diagnóstico (Documento 03A). */
export interface Hypothesis {
  id: string;
  dimension: "risk" | "opportunity" | "difficulty" | "advantage";
  title: string;
  justification: string;
  confidence: number;
}

/** Resumo executivo (Documento 06 — Motor de Resumo). */
export interface ExecutiveSummary {
  profile: string;
  mainDifficulty: string | null;
  mainOpportunity: string | null;
  topRisks: string[];
  promisingStrategies: string[];
}

/** Sessão de entrevista (Documento 10 — diagnosis_sessions). */
export interface DiagnosisSession {
  id: string;
  studentId: string;
  status: "in_progress" | "completed";
  answers: AnswerMap;
  currentStageIndex: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}
