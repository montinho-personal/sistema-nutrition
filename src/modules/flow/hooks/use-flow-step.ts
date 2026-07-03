"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { saveFlowStep } from "@/modules/flow/services/flowStateRepository";
import type { FlowState, FlowStepId } from "@/modules/flow/types";

const EMPTY: FlowState[] = [];

/**
 * Etapa atual do fluxo de um aluno, reativa à store local (retoma de onde
 * parou). Selecionar grava no repositório, que notifica a store — a UI atualiza
 * sem `setState` em efeito (mesmo padrão do diagnóstico e da estratégia).
 */
export function useFlowStep(studentId: string) {
  const states = useLocalCollection<FlowState[]>("flow_state", EMPTY);
  const saved = React.useMemo(
    () => states.find((s) => s.studentId === studentId)?.stepId ?? null,
    [states, studentId],
  );
  const select = React.useCallback(
    (id: FlowStepId) => saveFlowStep(studentId, id),
    [studentId],
  );
  return { saved, select };
}
