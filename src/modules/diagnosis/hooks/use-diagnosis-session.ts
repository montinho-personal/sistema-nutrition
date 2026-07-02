"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import {
  getOrCreateSession,
  getSessionForStudent,
  saveSession,
} from "@/modules/diagnosis/services";
import type { AnswerValue, DiagnosisSession } from "@/modules/diagnosis/types";

const EMPTY: DiagnosisSession[] = [];

/**
 * Sessão de entrevista com auto-save (Documento 07), reativa à store local.
 * Garante a existência da sessão via efeito (escrita na store, não `setState`),
 * e as mutações leem o estado mais recente do repositório (sem stale closure).
 */
export function useDiagnosisSession(studentId: string) {
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY);

  // Cria a sessão se ainda não existir. A escrita notifica a store e o
  // useSyncExternalStore re-renderiza — sem setState dentro do efeito.
  React.useEffect(() => {
    getOrCreateSession(studentId);
  }, [studentId]);

  const session = React.useMemo(
    () =>
      sessions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
    [sessions, studentId],
  );

  const setAnswer = React.useCallback(
    (key: string, value: AnswerValue) => {
      const current = getSessionForStudent(studentId);
      if (!current) return;
      saveSession(current.id, { answers: { ...current.answers, [key]: value } });
    },
    [studentId],
  );

  const setStageIndex = React.useCallback(
    (index: number) => {
      const current = getSessionForStudent(studentId);
      if (!current) return;
      saveSession(current.id, { currentStageIndex: index });
    },
    [studentId],
  );

  const complete = React.useCallback(() => {
    const current = getSessionForStudent(studentId);
    if (!current) return;
    saveSession(current.id, { status: "completed", completedAt: new Date().toISOString() });
  }, [studentId]);

  const reopen = React.useCallback(() => {
    const current = getSessionForStudent(studentId);
    if (!current) return;
    saveSession(current.id, { status: "in_progress", completedAt: null });
  }, [studentId]);

  return { session, setAnswer, setStageIndex, complete, reopen };
}
