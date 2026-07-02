/**
 * Store local reativa (localStorage) tipada e segura para SSR.
 *
 * Persistência local-first: o sistema funciona no navegador sem backend.
 * Expõe leitura com cache referencial (estável para `useSyncExternalStore`),
 * escrita com notificação e assinatura — quando o Supabase for conectado, os
 * repositórios de domínio ganham uma implementação remota atrás da mesma UI.
 */

import { logger } from "@/shared/services/logger";

const PREFIX = "mns:"; // Montinho Nutrition Strategy

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Assina mudanças da store (mesma aba e entre abas). */
export function subscribeLocal(listener: () => void): () => void {
  listeners.add(listener);
  if (isBrowser()) window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    if (isBrowser()) window.removeEventListener("storage", listener);
  };
}

// Cache por chave para manter a referência estável entre leituras iguais
// (requisito do useSyncExternalStore para evitar re-render infinito).
const cache = new Map<string, { raw: string | null; value: unknown }>();

/** Lê e desserializa um valor; retorna `fallback` (referência estável) se ausente. */
export function readLocal<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFIX + key);
  } catch {
    return fallback;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    value = raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    logger.warn("Falha ao ler armazenamento local", { key });
    value = fallback;
  }
  cache.set(key, { raw, value });
  return value;
}

/** Serializa e grava um valor, notificando os assinantes. */
export function writeLocal<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(PREFIX + key, raw);
    cache.set(key, { raw, value });
    emit();
  } catch {
    logger.error("Falha ao gravar armazenamento local", { key });
  }
}
