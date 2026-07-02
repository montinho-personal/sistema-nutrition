/**
 * Persistência das Configurações — os parâmetros de macro sobrescritos pelo
 * usuário (Documento 08). Local-first; os padrões vivem nas constantes.
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import { DEFAULT_MACRO_PARAMS } from "@/modules/strategy/constants/parameters";
import type { MacroParams } from "@/modules/strategy/types";

const STORAGE_KEY = "settings";

/** Mescla os overrides sobre os padrões, de forma defensiva (evita drift). */
function merge(stored: Partial<MacroParams> | null): MacroParams {
  if (!stored) return DEFAULT_MACRO_PARAMS;
  return {
    proteinGPerKg: { ...DEFAULT_MACRO_PARAMS.proteinGPerKg, ...(stored.proteinGPerKg ?? {}) },
    fatGPerKg: stored.fatGPerKg ?? DEFAULT_MACRO_PARAMS.fatGPerKg,
    velocityDeficitPct: {
      ...DEFAULT_MACRO_PARAMS.velocityDeficitPct,
      ...(stored.velocityDeficitPct ?? {}),
    },
    velocitySurplusPct: {
      ...DEFAULT_MACRO_PARAMS.velocitySurplusPct,
      ...(stored.velocitySurplusPct ?? {}),
    },
  };
}

/** Parâmetros de macro efetivos (overrides sobre os padrões). */
export function resolveMacroParams(): MacroParams {
  return merge(readLocal<Partial<MacroParams> | null>(STORAGE_KEY, null));
}

/** Salva os parâmetros de macro sobrescritos. */
export function saveMacroParams(params: MacroParams): void {
  writeLocal(STORAGE_KEY, params);
}

/** Restaura os padrões (remove overrides). */
export function resetMacroParams(): void {
  writeLocal(STORAGE_KEY, DEFAULT_MACRO_PARAMS);
}
