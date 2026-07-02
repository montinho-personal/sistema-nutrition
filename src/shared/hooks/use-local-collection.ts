"use client";

import * as React from "react";

import { readLocal, subscribeLocal } from "@/shared/lib/local-store";

/**
 * Lê uma coleção da store local de forma reativa (useSyncExternalStore).
 * Reflete automaticamente escritas feitas em qualquer componente ou aba,
 * sem `setState` dentro de efeitos. `fallback` deve ter referência estável.
 */
export function useLocalCollection<T>(key: string, fallback: T): T {
  return React.useSyncExternalStore(
    subscribeLocal,
    () => readLocal<T>(key, fallback),
    () => fallback,
  );
}
