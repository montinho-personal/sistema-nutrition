/**
 * Repositório das sessões de diagnóstico — persistência local-first
 * (mesma estratégia dos alunos; Supabase entra atrás desta interface).
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { AnswerMap, DiagnosisSession } from "@/modules/diagnosis/types";

const STORAGE_KEY = "diagnosis_sessions";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `dx_${Math.abs(Date.now())}`;
}

function readAll(): DiagnosisSession[] {
  return readLocal<DiagnosisSession[]>(STORAGE_KEY, []);
}

function persist(sessions: DiagnosisSession[]): void {
  writeLocal(STORAGE_KEY, sessions);
}

/** Sessão mais recente de um aluno, ou null. */
export function getSessionForStudent(studentId: string): DiagnosisSession | null {
  return (
    readAll()
      .filter((s) => s.studentId === studentId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

/** Retorna a sessão atual do aluno ou cria uma nova em andamento. */
export function getOrCreateSession(studentId: string): DiagnosisSession {
  const existing = getSessionForStudent(studentId);
  if (existing) return existing;
  const timestamp = nowIso();
  const session: DiagnosisSession = {
    id: newId(),
    studentId,
    status: "in_progress",
    answers: {},
    currentStageIndex: 0,
    startedAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
  persist([session, ...readAll()]);
  return session;
}

/** Salva alterações de uma sessão (auto-save). */
export function saveSession(
  id: string,
  patch: Partial<
    Pick<DiagnosisSession, "answers" | "currentStageIndex" | "status" | "completedAt">
  >,
): DiagnosisSession | null {
  const all = readAll();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const updated: DiagnosisSession = { ...all[index], ...patch, updatedAt: nowIso() };
  all[index] = updated;
  persist(all);
  return updated;
}

/** Atalho para gravar respostas. */
export function saveAnswers(id: string, answers: AnswerMap): DiagnosisSession | null {
  return saveSession(id, { answers });
}
