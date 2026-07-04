"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { saveStrategyInput } from "@/modules/strategy/services/strategyRepository";
import type { StrategyInput, StrategyRecord } from "@/modules/strategy/types";

const EMPTY: StrategyRecord[] = [];

/**
 * Input antropométrico reativo de um aluno (store local). A gravação escreve no
 * repositório, que notifica a store — a UI atualiza sem `setState` em efeitos.
 */
export function useStrategyInput(studentId: string) {
  const records = useLocalCollection<StrategyRecord[]>("strategy_records", EMPTY);
  const record = React.useMemo(
    () => records.find((r) => r.studentId === studentId) ?? null,
    [records, studentId],
  );

  const save = React.useCallback(
    (input: StrategyInput) => saveStrategyInput(studentId, input),
    [studentId],
  );

  return { input: record?.input ?? null, record, save };
}
