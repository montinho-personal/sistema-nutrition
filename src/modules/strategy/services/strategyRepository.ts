/**
 * Repositório da estratégia — persistência local-first (mesma estratégia dos
 * demais módulos; Supabase entra atrás desta interface).
 *
 * Persistimos apenas o `input` antropométrico (peso, % de gordura) — a
 * estratégia e os macros são derivados de forma determinística do diagnóstico +
 * objetivo, então nunca ficam dessincronizados (Documento 17 — evoluir, nunca
 * duplicar estado).
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { StrategyInput, StrategyRecord } from "@/modules/strategy/types";

const STORAGE_KEY = "strategy_records";

function nowIso(): string {
  return new Date().toISOString();
}

function readAll(): StrategyRecord[] {
  return readLocal<StrategyRecord[]>(STORAGE_KEY, []);
}

function persist(records: StrategyRecord[]): void {
  writeLocal(STORAGE_KEY, records);
}

/** Registro de estratégia de um aluno, ou null. */
export function getStrategyRecord(studentId: string): StrategyRecord | null {
  return readAll().find((r) => r.studentId === studentId) ?? null;
}

/** Cria/atualiza o input antropométrico do aluno (upsert). */
export function saveStrategyInput(studentId: string, input: StrategyInput): StrategyRecord {
  const all = readAll();
  const index = all.findIndex((r) => r.studentId === studentId);
  const timestamp = nowIso();

  if (index === -1) {
    const record: StrategyRecord = {
      studentId,
      input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    persist([record, ...all]);
    return record;
  }

  const updated: StrategyRecord = { ...all[index], input, updatedAt: timestamp };
  // Novo array (nunca mutar o em cache — senão o useSyncExternalStore não
  // dispara re-render por comparar a referência).
  persist(all.map((r, i) => (i === index ? updated : r)));
  return updated;
}
