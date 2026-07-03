/**
 * Referências determinísticas do Dashboard do Diagnóstico (Workflow V1 — Etapa 2).
 * Sem número mágico (Doc 08): todo parâmetro clínico mora aqui.
 */

/** Faixas de IMC (kg/m²) e o rótulo clínico (OMS). */
export const IMC_BANDS: { max: number; label: string }[] = [
  { max: 18.5, label: "Abaixo do peso" },
  { max: 25, label: "Peso normal" },
  { max: 30, label: "Sobrepeso" },
  { max: 35, label: "Obesidade grau I" },
  { max: 40, label: "Obesidade grau II" },
  { max: Infinity, label: "Obesidade grau III" },
];

/** Referências nutricionais gerais. */
export const NUTRITION_REFERENCE = {
  /** Água recomendada por kg de peso (ml/dia). */
  waterMlPerKg: 35,
  /** Fibra recomendada por 1000 kcal (g). */
  fiberGPer1000Kcal: 14,
} as const;

/** Estimativa de ingestão de água (litros/dia) a partir da resposta da anamnese. */
export const WATER_INTAKE_LITERS: Record<string, number> = {
  menos_1l: 0.75,
  "1_2l": 1.5,
  mais_2l: 2.25,
};

/** Limiares do grau de dificuldade do caso (0–100, maior = mais difícil). */
export const DIFFICULTY_BANDS = { baixo: 34, medio: 61 } as const;
