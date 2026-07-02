/**
 * Validação do formulário de aluno (Documento 11 — sempre com Zod).
 */

import { z } from "zod";

export const studentGoalSchema = z.enum([
  "weight_loss",
  "hypertrophy",
  "recomposition",
  "maintenance",
  "performance",
  "health",
  "event_preparation",
]);

export const studentSexSchema = z.enum(["male", "female", "other"]);

export const studentFormSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome do aluno."),
  sex: studentSexSchema.nullable(),
  birthDate: z.string().nullable(),
  heightCm: z.number().min(80, "Altura muito baixa.").max(250, "Altura muito alta.").nullable(),
  mainGoal: studentGoalSchema.nullable(),
  email: z.string().email("E-mail inválido.").nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
