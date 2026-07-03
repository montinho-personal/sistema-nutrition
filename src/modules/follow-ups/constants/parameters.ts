/**
 * Parâmetros dos Acompanhamentos (Documento 08 — nenhum número mágico).
 *
 * Previsão de evolução, bandas de aderência ao ritmo esperado e limiares dos
 * insights — ponto único de verdade, ajustável no futuro pelas Configurações.
 */

import type { FollowUpScales, MeasurementKey } from "@/modules/follow-ups/types";

/** Energia equivalente a 1 kg de peso corporal (kcal). */
export const KCAL_PER_KG = 7700;

/**
 * Fração do superávit que vira peso na balança (o restante é água/glicogênio ou
 * não retido). Conservador — o superávit não é 100% ganho de massa medido.
 */
export const SURPLUS_GAIN_FACTOR = 0.5;

/** Bandas do ritmo real ante o esperado (fração do esperado). */
export const RATE_BANDS = {
  /** Abaixo desta fração do esperado → progresso "lento". */
  slowBelow: 0.6,
  /** Acima desta fração do esperado → ritmo "acelerado" (atenção). */
  fastAbove: 1.4,
  /** Abaixo desta fração (em módulo) → considerado estagnado. */
  stalledBelow: 0.25,
} as const;

/** Tolerância de manutenção: variação semanal aceita como estável (kg). */
export const MAINTENANCE_TOLERANCE_KG = 0.25;

/** Mínimo de dias entre o início e o último ponto para calcular ritmo. */
export const MIN_DAYS_FOR_RATE = 3;

/** Limiares dos indicadores subjetivos (0–10) para disparar insights. */
export const SCALE_THRESHOLDS = {
  low: 4,
  high: 7,
} as const;

/** Rótulos pt-BR dos indicadores. */
export const SCALE_LABELS: Record<keyof FollowUpScales, string> = {
  adherence: "Adesão",
  hunger: "Fome",
  sleep: "Sono",
  energy: "Energia",
  mood: "Humor",
};

/** Indicadores cuja leitura é invertida (maior = pior). */
export const INVERTED_SCALES: (keyof FollowUpScales)[] = ["hunger"];

/** Circunferências acompanhadas (ordem de exibição) e seus rótulos pt-BR. */
export const MEASUREMENT_KEYS: MeasurementKey[] = [
  "waist",
  "abdomen",
  "hip",
  "chest",
  "arm",
  "thigh",
];
export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  waist: "Cintura",
  abdomen: "Abdômen",
  hip: "Quadril",
  chest: "Peitoral",
  arm: "Braço",
  thigh: "Coxa",
};

/**
 * Previsão de resultado (Documento 03F). Bandas de "no ritmo" ante o planejado
 * e pesos da confiança (mais dados + mais tempo → maior confiança).
 */
export const PREDICTION = {
  /** Abaixo desta fração da meta no prazo → "abaixo do previsto". */
  behindBelowPct: 80,
  /** Acima desta fração → "acima do previsto". */
  aheadAbovePct: 120,
  /** Ritmo (kg/semana, em módulo) abaixo do qual é considerado estagnado. */
  stallWeeklyKg: 0.1,
  /** Confiança: nº de acompanhamentos que satura o peso, e o peso (0–100). */
  confidencePointsCap: 5,
  confidencePointsWeight: 60,
  /** Confiança: semanas decorridas que saturam o peso, e o peso (0–100). */
  confidenceWeeksCap: 8,
  confidenceWeeksWeight: 40,
} as const;

/** Rótulos pt-BR dos status de evolução. */
export const STATUS_LABELS: Record<string, string> = {
  on_track: "No ritmo esperado",
  slow: "Abaixo do esperado",
  fast: "Acima do esperado",
  stalled: "Estagnado",
  reversing: "Tendência contrária",
  insufficient: "Dados insuficientes",
};
