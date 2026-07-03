/**
 * Validação do input antropométrico da estratégia (Documento 11 — Zod).
 */

import { z } from "zod";

import { MACRO_OVERRIDE_LIMITS } from "@/modules/strategy/constants/parameters";

/**
 * Ajuste manual de macros: calorias-alvo + divisão percentual (P/C/G).
 * Os percentuais precisam somar 100 (com tolerância de 1% para arredondamento).
 */
export const macroOverrideSchema = z
  .object({
    calories: z
      .number({ message: "Informe as calorias." })
      .int("Use calorias inteiras.")
      .min(MACRO_OVERRIDE_LIMITS.minCalories, "Calorias muito baixas.")
      .max(MACRO_OVERRIDE_LIMITS.maxCalories, "Calorias muito altas."),
    proteinPct: z.number().min(0, "Mín. 0%.").max(100, "Máx. 100%."),
    carbPct: z.number().min(0, "Mín. 0%.").max(100, "Máx. 100%."),
    fatPct: z.number().min(0, "Mín. 0%.").max(100, "Máx. 100%."),
  })
  .refine((v) => Math.abs(v.proteinPct + v.carbPct + v.fatPct - 100) <= 1, {
    message: "Os percentuais precisam somar 100%.",
    path: ["carbPct"],
  });

export type MacroOverrideValues = z.infer<typeof macroOverrideSchema>;

export const strategyInputSchema = z.object({
  currentWeightKg: z
    .number()
    .min(30, "Peso muito baixo.")
    .max(300, "Peso muito alto."),
  bodyFatPct: z
    .number()
    .min(3, "% de gordura muito baixo.")
    .max(60, "% de gordura muito alto.")
    .nullable(),
  targetChangeKg: z
    .number()
    .min(0.5, "Meta muito pequena.")
    .max(100, "Meta muito alta.")
    .nullable()
    .optional(),
  targetWeeks: z
    .number()
    .int("Use semanas inteiras.")
    .min(1, "Prazo muito curto.")
    .max(104, "Prazo muito longo (máx. 2 anos).")
    .nullable()
    .optional(),
});

export type StrategyInputValues = z.infer<typeof strategyInputSchema>;
