"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { DEFAULT_MACRO_PARAMS } from "@/modules/strategy/constants/parameters";
import type { MacroParams } from "@/modules/strategy/types";

/**
 * Parâmetros de macro reativos (overrides sobre os padrões). Os componentes que
 * calculam macros usam este hook para respeitar as Configurações do usuário.
 */
export function useMacroParams(): MacroParams {
  const stored = useLocalCollection<Partial<MacroParams> | null>("settings", null);
  return React.useMemo<MacroParams>(() => {
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
  }, [stored]);
}
