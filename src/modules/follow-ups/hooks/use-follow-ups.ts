"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { createFollowUp, deleteFollowUp } from "@/modules/follow-ups/services/followUpRepository";
import type { FollowUp, FollowUpInput } from "@/modules/follow-ups/types";

const EMPTY: FollowUp[] = [];

/**
 * Acompanhamentos reativos de um aluno (store local). Mutações escrevem no
 * repositório, que notifica a store — sem `setState` em efeitos.
 */
export function useFollowUps(studentId: string) {
  const raw = useLocalCollection<FollowUp[]>("followups", EMPTY);
  const followUps = React.useMemo(
    () =>
      raw
        .filter((f) => f.studentId === studentId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
    [raw, studentId],
  );

  const add = React.useCallback(
    (input: FollowUpInput) => createFollowUp(studentId, input),
    [studentId],
  );
  const remove = React.useCallback((id: string) => deleteFollowUp(id), []);

  return { followUps, add, remove };
}
