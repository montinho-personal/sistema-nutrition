/**
 * Repositório do progresso do fluxo — persistência local-first (retomar de onde
 * parou). Guarda apenas a última etapa por aluno; o resto é derivado do estado
 * real dos módulos (diagnóstico, estratégia…), então nunca dessincroniza.
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { FlowState, FlowStepId } from "@/modules/flow/types";

const STORAGE_KEY = "flow_state";

function readAll(): FlowState[] {
  return readLocal<FlowState[]>(STORAGE_KEY, []);
}

/** Etapa salva do aluno, ou null. */
export function getFlowStep(studentId: string): FlowStepId | null {
  return readAll().find((s) => s.studentId === studentId)?.stepId ?? null;
}

/** Salva a etapa atual do aluno (upsert). Novo array — nunca mutar em cache. */
export function saveFlowStep(studentId: string, stepId: FlowStepId): void {
  const all = readAll();
  const timestamp = new Date().toISOString();
  const index = all.findIndex((s) => s.studentId === studentId);
  if (index === -1) {
    writeLocal(STORAGE_KEY, [{ studentId, stepId, updatedAt: timestamp }, ...all]);
    return;
  }
  writeLocal(
    STORAGE_KEY,
    all.map((s, i) => (i === index ? { ...s, stepId, updatedAt: timestamp } : s)),
  );
}
