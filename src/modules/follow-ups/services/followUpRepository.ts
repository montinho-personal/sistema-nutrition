/**
 * Repositório dos Acompanhamentos — persistência local-first (mesma estratégia
 * dos demais módulos; Supabase entra atrás desta interface, tabela
 * `montinho.followups`).
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { FollowUp, FollowUpInput } from "@/modules/follow-ups/types";

const STORAGE_KEY = "followups";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `fu_${Math.abs(Date.now())}`;
}

function readAll(): FollowUp[] {
  return readLocal<FollowUp[]>(STORAGE_KEY, []);
}

function persist(items: FollowUp[]): void {
  writeLocal(STORAGE_KEY, items);
}

/** Acompanhamentos de um aluno, do mais antigo ao mais recente. */
export function listFollowUps(studentId: string): FollowUp[] {
  return readAll()
    .filter((f) => f.studentId === studentId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

/** Registra um novo acompanhamento. */
export function createFollowUp(studentId: string, input: FollowUpInput): FollowUp {
  const followUp: FollowUp = {
    id: newId(),
    studentId,
    date: input.date,
    weightKg: input.weightKg,
    scales: input.scales,
    whatWorked: input.whatWorked,
    whatFailed: input.whatFailed,
    why: input.why,
    createdAt: nowIso(),
  };
  persist([...readAll(), followUp]);
  return followUp;
}

/** Remove um acompanhamento. */
export function deleteFollowUp(id: string): void {
  persist(readAll().filter((f) => f.id !== id));
}
