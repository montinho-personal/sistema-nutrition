/**
 * Leitura de dados da anamnese que alimentam outros motores (ex.: o gasto
 * calórico). Ponto único, para os módulos não repetirem o parsing.
 */

import type { AnswerMap } from "@/modules/diagnosis/types";

/** Dias de treino/semana e duração (min) da anamnese — refinam o TDEE. */
export function readTrainingContext(answers: AnswerMap | undefined): {
  trainingDaysPerWeek: number | null;
  trainingMinutes: number | null;
} {
  const days = answers?.training_days_per_week;
  const minutes = answers?.training_duration;
  return {
    trainingDaysPerWeek: typeof days === "number" ? days : null,
    trainingMinutes: typeof minutes === "number" ? minutes : null,
  };
}
