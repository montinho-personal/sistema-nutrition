/**
 * Validação do acompanhamento (Documento 11 — sempre com Zod).
 */

import { z } from "zod";

const scale = z.number().min(0, "Mínimo 0.").max(10, "Máximo 10.");

export const followUpScalesSchema = z.object({
  adherence: scale,
  hunger: scale,
  sleep: scale,
  energy: scale,
  mood: scale,
});

export const followUpFormSchema = z.object({
  date: z.string().min(1, "Informe a data."),
  weightKg: z.number().min(30, "Peso muito baixo.").max(300, "Peso muito alto."),
  scales: followUpScalesSchema,
  whatWorked: z.string().nullable(),
  whatFailed: z.string().nullable(),
  why: z.string().nullable(),
});

export type FollowUpFormValues = z.infer<typeof followUpFormSchema>;
