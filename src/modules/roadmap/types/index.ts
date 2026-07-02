/**
 * Tipos do Roadmap da Transformação (Documento 03E — TRE).
 *
 * O sistema entrega um caminho, não uma dieta: a jornada em 7 fases, derivada
 * de forma determinística do estado real do aluno (Documento 08 — regra).
 */

/** As 7 fases (chaves alinhadas ao banco — migração 0009). */
export type PhaseKey =
  | "diagnosis"
  | "preparation"
  | "implementation"
  | "consolidation"
  | "optimization"
  | "transition"
  | "maintenance";

export type PhaseStatus = "completed" | "current" | "upcoming";

/** Descrição fixa de uma fase (Documento 03E — objetivo de cada fase). */
export interface PhaseDescriptor {
  key: PhaseKey;
  position: number;
  title: string;
  /** Objetivo curto da fase. */
  objective: string;
  /** Qual problema esta fase resolve. */
  problem: string;
  /** Por que a fase existe. */
  why: string;
  /** Quando a fase termina. */
  exitCriterion: string;
  /** Qual indicador define sucesso. */
  successIndicator: string;
}

/** Uma fase no roadmap do aluno, com seu status atual. */
export interface RoadmapPhase extends PhaseDescriptor {
  status: PhaseStatus;
}

/** Painel da Transformação (Documento 03E — sempre mostrar). */
export interface TransformationPanel {
  currentPhaseTitle: string;
  currentObjective: string;
  mainChallenge: string | null;
  mainOpportunity: string | null;
  nextGoal: string;
  /** Previsão da próxima revisão (yyyy-mm-dd) ou null. */
  nextReview: string | null;
}

/** Linha do tempo resumida da jornada. */
export interface RoadmapJourney {
  startWeight: number | null;
  currentWeight: number | null;
  totalChangeKg: number | null;
  weeksElapsed: number;
  phasesCompleted: number;
  totalPhases: number;
}

/** O roadmap completo do aluno. */
export interface Roadmap {
  currentPhase: PhaseKey;
  phases: RoadmapPhase[];
  panel: TransformationPanel;
  journey: RoadmapJourney;
}
