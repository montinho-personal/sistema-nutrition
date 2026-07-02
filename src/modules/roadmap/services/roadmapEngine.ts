/**
 * Motor do Roadmap (Documento 03E — TRE). Determina a fase atual a partir de
 * sinais reais (diagnóstico, estratégia, acompanhamentos, evolução) — nunca só
 * por tempo — e monta o Painel da Transformação e a linha do tempo.
 *
 * Determinístico e auditável (Documento 08 — regra, não IA).
 */

import type { EnergyDirection, StrategyVelocity } from "@/modules/strategy/types";
import {
  ADVANCE_THRESHOLDS,
  PHASE_BY_KEY,
  PHASE_DESCRIPTORS,
  REVIEW_CADENCE_WEEKS,
  TOTAL_PHASES,
} from "@/modules/roadmap/constants/phases";
import type {
  PhaseKey,
  Roadmap,
  RoadmapJourney,
  RoadmapPhase,
  TransformationPanel,
} from "@/modules/roadmap/types";

/** Sinais do estado do aluno usados para posicionar a jornada. */
export interface RoadmapContext {
  hasDiagnosis: boolean;
  hasStrategy: boolean;
  direction: EnergyDirection | null;
  velocity: StrategyVelocity | null;
  followUpCount: number;
  weeksElapsed: number;
  mainChallenge: string | null;
  mainOpportunity: string | null;
  startWeight: number | null;
  currentWeight: number | null;
  totalChangeKg: number | null;
  /** Última data relevante (último acompanhamento ou início da estratégia). */
  lastActivityDate: string | null;
}

/** Fase atual a partir dos sinais — avanço por evidência, não por tempo. */
function determineCurrentPhase(ctx: RoadmapContext): PhaseKey {
  if (!ctx.hasDiagnosis) return "diagnosis";
  if (!ctx.hasStrategy) return "preparation";
  if (ctx.followUpCount === 0) return "implementation";

  // Objetivo de manutenção: consolida e segue para manutenção.
  if (ctx.direction === "manutencao") {
    return ctx.weeksElapsed >= ADVANCE_THRESHOLDS.maintenanceWeeks ? "maintenance" : "consolidation";
  }

  // Déficit/superávit: implementação → consolidação → otimização.
  // Transição/manutenção dependem de "objetivo atingido", que não medimos aqui.
  if (
    ctx.followUpCount < ADVANCE_THRESHOLDS.consolidationFollowUps ||
    ctx.weeksElapsed < ADVANCE_THRESHOLDS.consolidationWeeks
  ) {
    return "implementation";
  }
  if (ctx.weeksElapsed < ADVANCE_THRESHOLDS.optimizationWeeks) return "consolidation";
  return "optimization";
}

function addWeeksIso(dateIso: string, weeks: number): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function reviewCadenceWeeks(velocity: StrategyVelocity | null): number {
  return velocity === "intensiva" || velocity === "agressiva"
    ? REVIEW_CADENCE_WEEKS.fast
    : REVIEW_CADENCE_WEEKS.normal;
}

function buildPanel(currentKey: PhaseKey, ctx: RoadmapContext): TransformationPanel {
  const current = PHASE_BY_KEY[currentKey];
  const next = PHASE_DESCRIPTORS.find((p) => p.position === current.position + 1);
  const nextGoal = next
    ? `${next.title}: ${next.objective}`
    : "Sustentar o resultado a longo prazo.";
  const nextReview =
    ctx.lastActivityDate && ctx.hasStrategy
      ? addWeeksIso(ctx.lastActivityDate, reviewCadenceWeeks(ctx.velocity))
      : null;

  return {
    currentPhaseTitle: current.title,
    currentObjective: current.objective,
    mainChallenge: ctx.mainChallenge,
    mainOpportunity: ctx.mainOpportunity,
    nextGoal,
    nextReview,
  };
}

/** Monta o roadmap completo do aluno. */
export function buildRoadmap(ctx: RoadmapContext): Roadmap {
  const currentKey = determineCurrentPhase(ctx);
  const currentPosition = PHASE_BY_KEY[currentKey].position;

  const phases: RoadmapPhase[] = PHASE_DESCRIPTORS.map((descriptor) => ({
    ...descriptor,
    status:
      descriptor.position < currentPosition
        ? "completed"
        : descriptor.position === currentPosition
          ? "current"
          : "upcoming",
  }));

  const journey: RoadmapJourney = {
    startWeight: ctx.startWeight,
    currentWeight: ctx.currentWeight,
    totalChangeKg: ctx.totalChangeKg,
    weeksElapsed: ctx.weeksElapsed,
    phasesCompleted: currentPosition - 1,
    totalPhases: TOTAL_PHASES,
  };

  return {
    currentPhase: currentKey,
    phases,
    panel: buildPanel(currentKey, ctx),
    journey,
  };
}
