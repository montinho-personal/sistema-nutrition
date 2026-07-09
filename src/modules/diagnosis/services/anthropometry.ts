/**
 * Antropometria essencial — peso, altura e idade (Documento 06).
 *
 * A anamnese captura os três; o cadastro do aluno passa a ser opcional nesses
 * campos. Precedência única em todo o sistema: o CADASTRO vence quando existe
 * (dado curado pelo treinador), a ANAMNESE cobre quando não existe — assim a
 * cadeia Estratégia → Macros → Cardápio nunca degrada para a estimativa
 * "fallback" por falta de um dado que o aluno já informou.
 */

import type { Student } from "@/modules/students/types";
import type { AnswerMap } from "@/modules/diagnosis/types";
import { ANTHROPOMETRY_LIMITS } from "@/modules/diagnosis/constants";
import { ageFromBirthDate } from "@/modules/diagnosis/services/executiveSummary";

/** Número da resposta dentro de uma faixa de sanidade — fora dela, null. */
function boundedAnswer(
  value: unknown,
  limits: { min: number; max: number },
): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n >= limits.min && n <= limits.max ? n : null;
}

/** Peso, altura e idade relatados na anamnese (validados; ausente/absurdo = null). */
export function readAnthropometry(answers: AnswerMap): {
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
} {
  return {
    weightKg: boundedAnswer(answers.current_weight_kg, ANTHROPOMETRY_LIMITS.weightKg),
    heightCm: boundedAnswer(answers.height_cm, ANTHROPOMETRY_LIMITS.heightCm),
    ageYears: boundedAnswer(answers.age_years, ANTHROPOMETRY_LIMITS.ageYears),
  };
}

/** Idade efetiva: data de nascimento do cadastro; sem ela, a idade da anamnese. */
export function resolveAgeYears(
  student: Pick<Student, "birthDate"> | null,
  answers: AnswerMap | null | undefined,
): number | null {
  return ageFromBirthDate(student?.birthDate ?? null) ?? readAnthropometry(answers ?? {}).ageYears;
}

/** Altura efetiva: a do cadastro; sem ela, a da anamnese. */
export function resolveHeightCm(
  student: Pick<Student, "heightCm"> | null,
  answers: AnswerMap | null | undefined,
): number | null {
  return student?.heightCm ?? readAnthropometry(answers ?? {}).heightCm;
}
