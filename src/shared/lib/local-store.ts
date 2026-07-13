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

// Observadores de escrita (desacoplados): a camada de sync na nuvem se
// registra aqui para replicar as coleções, sem que a store conheça o Supabase.
const writeListeners = new Set<(key: string, value: unknown) => void>();

/** Registra um observador de escritas (retorna a função para cancelar). */
export function onLocalWrite(listener: (key: string, value: unknown) => void): () => void {
  writeListeners.add(listener);
  return () => writeListeners.delete(listener);
}

// Observadores de FALHA de escrita — antes a falha só ia para o console
// (invisível ao treinador); uma mudança real podia "sumir" sem explicação
// nenhuma (cota de armazenamento estourada, navegação privada). Um componente
// de interface se registra aqui para avisar de verdade (Documento 02: nunca
// esconder um risco do usuário).
const writeErrorListeners = new Set<(key: string, error: unknown) => void>();

/** Registra um observador de falhas de escrita (retorna a função para cancelar). */
export function onLocalWriteError(listener: (key: string, error: unknown) => void): () => void {
  writeErrorListeners.add(listener);
  return () => writeErrorListeners.delete(listener);
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
    for (const listener of writeListeners) listener(key, value);
  } catch (error) {
    logger.error("Falha ao gravar armazenamento local", { key });
    for (const listener of writeErrorListeners) listener(key, error);
  }
}
