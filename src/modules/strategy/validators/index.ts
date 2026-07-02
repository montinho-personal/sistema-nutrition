/**
 * Validação do input antropométrico da estratégia (Documento 11 — Zod).
 */

import { z } from "zod";

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
