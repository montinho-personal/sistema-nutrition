/**
 * Histórico de trocas do cardápio — persistência local-first (Documento 00:
 * toda troca fica auditável — alimento original, substituto, modo, calorias e
 * macros antes/depois, timestamp). Mesma estratégia dos demais repositórios;
 * Supabase entra atrás desta interface quando conectado.
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { SwapHistoryEntry } from "@/modules/meal-plan/types";

const STORAGE_KEY = "meal_plan_swap_history";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `swap_${Math.abs(Date.now())}`;
}

function readAll(): SwapHistoryEntry[] {
  return readLocal<SwapHistoryEntry[]>(STORAGE_KEY, []);
}

function persist(entries: SwapHistoryEntry[]): void {
  writeLocal(STORAGE_KEY, entries);
}

/** Histórico de trocas de um aluno, mais recente primeiro. */
export function listSwapHistory(studentId: string): SwapHistoryEntry[] {
  return readAll()
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type LogSwapInput = Omit<SwapHistoryEntry, "id" | "createdAt">;

/** Registra uma troca confirmada (auditoria — nunca sobrescreve, só acumula). */
export function logSwap(input: LogSwapInput): SwapHistoryEntry {
  const entry: SwapHistoryEntry = { ...input, id: newId(), createdAt: nowIso() };
  persist([entry, ...readAll()]);
  return entry;
}
