/**
 * Sequenciamento do fluxo (Workflow V1) — regra pura e auditável de quais etapas
 * estão alcançáveis, quais estão concluídas e qual é a próxima ação. Vive em
 * `services/` (Doc 11) para ser testável fora do React.
 */

import { FLOW_STEPS } from "@/modules/flow/constants/steps";
import type { FlowStepId } from "@/modules/flow/types";

export interface FlowProgressInput {
  /** Anamnese concluída (sessão de diagnóstico completa). */
  anamneseComplete: boolean;
  /** Objetivo principal do aluno definido. */
  hasGoal: boolean;
  /** Estratégia com macros calculados (há peso e diagnóstico). */
  estrategiaComplete: boolean;
}

export type FlowStepState = Record<FlowStepId, { reachable: boolean; done: boolean }>;

/** Estado (alcançável/concluída) de cada etapa a partir do progresso real. */
export function deriveStepState(input: FlowProgressInput): FlowStepState {
  const { anamneseComplete, hasGoal, estrategiaComplete } = input;
  const diagnosticoReady = anamneseComplete && hasGoal;

  const reachable: Record<FlowStepId, boolean> = {
    anamnese: true,
    diagnostico: anamneseComplete,
    estrategia: diagnosticoReady,
    alimentar: estrategiaComplete,
    cardapio: estrategiaComplete,
    validacao: estrategiaComplete,
    documento: estrategiaComplete,
  };
  const done: Record<FlowStepId, boolean> = {
    anamnese: anamneseComplete,
    diagnostico: anamneseComplete,
    estrategia: estrategiaComplete,
    alimentar: false,
    cardapio: false,
    validacao: false,
    documento: false,
  };

  return Object.fromEntries(
    FLOW_STEPS.map((s) => [s.id, { reachable: reachable[s.id], done: done[s.id] }]),
  ) as FlowStepState;
}

/** Primeira etapa alcançável ainda não concluída — onde retomar o fluxo. */
export function firstActionableStep(stepState: FlowStepState): FlowStepId {
  const pending = FLOW_STEPS.find((s) => stepState[s.id].reachable && !stepState[s.id].done);
  if (pending) return pending.id;
  const reachable = FLOW_STEPS.filter((s) => stepState[s.id].reachable);
  return (reachable[reachable.length - 1] ?? FLOW_STEPS[0]).id;
}
