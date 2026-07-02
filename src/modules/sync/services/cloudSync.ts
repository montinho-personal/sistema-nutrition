/**
 * Sincronização na nuvem (Sprint A — Persistência) — camada ADITIVA.
 *
 * O `localStorage` continua sendo a fonte reativa da UI (zero regressão). Este
 * serviço apenas espelha as coleções no Supabase quando há sessão:
 *  - toda escrita local agenda um envio (debounced) → backup contínuo;
 *  - ao entrar, baixa e funde o que está na nuvem → restauração/multi-dispositivo.
 *
 * Tudo em try/catch e sem bloquear a UI: se a nuvem falhar, o app segue local.
 */

import { onLocalWrite, readLocal, writeLocal } from "@/shared/lib/local-store";
import { getSupabaseBrowser } from "@/database/supabase/client";
import { logger } from "@/shared/services/logger";
import { mergeCollection } from "@/modules/sync/services/mergeCollections";

/** Coleções locais espelhadas na nuvem (mesmas chaves do localStorage). */
const SYNCED_COLLECTIONS: { key: string; kind: "array" | "object" }[] = [
  { key: "students", kind: "array" },
  { key: "diagnosis_sessions", kind: "array" },
  { key: "strategy_records", kind: "array" },
  { key: "followups", kind: "array" },
  { key: "meal_plan_prefs", kind: "array" },
  { key: "settings", kind: "object" },
];

const SYNCED_KEYS = new Set(SYNCED_COLLECTIONS.map((c) => c.key));
const PUSH_DEBOUNCE_MS = 1500;

export type SyncStatus = "off" | "syncing" | "synced" | "error";

let status: SyncStatus = "off";
const statusListeners = new Set<() => void>();

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function setStatus(next: SyncStatus): void {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) listener();
}

let enabled = false;
let hydrating = false;
let configured = false;
const pendingPushes = new Map<string, ReturnType<typeof setTimeout>>();

async function pushKey(key: string): Promise<void> {
  const client = getSupabaseBrowser();
  if (!client || !enabled) return;
  try {
    setStatus("syncing");
    const value = readLocal<unknown>(key, []);
    const { error } = await client.rpc("montinho_sync_push", { p_key: key, p_data: value ?? [] });
    if (error) {
      logger.warn("Falha ao enviar coleção para a nuvem", { key });
      setStatus("error");
      return;
    }
    setStatus("synced");
  } catch {
    setStatus("error");
  }
}

function schedulePush(key: string): void {
  if (!enabled || hydrating || !SYNCED_KEYS.has(key)) return;
  const previous = pendingPushes.get(key);
  if (previous) clearTimeout(previous);
  pendingPushes.set(
    key,
    setTimeout(() => {
      pendingPushes.delete(key);
      void pushKey(key);
    }, PUSH_DEBOUNCE_MS),
  );
}

/** Envia todas as coleções locais (backup completo / primeira sincronização). */
async function pushAll(): Promise<void> {
  for (const collection of SYNCED_COLLECTIONS) {
    await pushKey(collection.key);
  }
}

/**
 * Baixa as coleções da nuvem e funde com o local (a mais recente vence), depois
 * reenvia tudo para reconciliar. Chamada ao entrar/na carga com sessão ativa.
 */
export async function hydrateFromCloud(): Promise<void> {
  const client = getSupabaseBrowser();
  if (!client || !enabled) return;
  try {
    setStatus("syncing");
    const { data, error } = await client.rpc("montinho_sync_pull");
    if (error) {
      setStatus("error");
      return;
    }
    const rows = (Array.isArray(data) ? data : []) as {
      collection_key: string;
      data: unknown;
    }[];
    const cloudByKey = new Map(rows.map((r) => [r.collection_key, r.data]));

    hydrating = true;
    for (const collection of SYNCED_COLLECTIONS) {
      if (!cloudByKey.has(collection.key)) continue;
      const cloud = cloudByKey.get(collection.key);
      const local = readLocal<unknown>(collection.key, collection.kind === "array" ? [] : null);
      const merged = mergeCollection(collection.kind, local, cloud);
      writeLocal(collection.key, merged);
    }
    hydrating = false;

    await pushAll();
    setStatus("synced");
  } catch {
    hydrating = false;
    setStatus("error");
  }
}

/** Registra o espelhamento das escritas locais (idempotente). */
export function configureSync(): void {
  if (configured) return;
  configured = true;
  onLocalWrite((key) => schedulePush(key));
}

/** Liga/desliga a sincronização (ligada quando há sessão). */
export function setSyncEnabled(active: boolean): void {
  enabled = active;
  if (!active) setStatus("off");
}
