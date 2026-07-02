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
});

export type StrategyInputValues = z.infer<typeof strategyInputSchema>;
