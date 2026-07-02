/**
 * Tipos dos Acompanhamentos (Documentos 01, 05 — PNI; 03E — Indicadores da
 * Jornada). Monitoramento contínuo que alimenta a inteligência individual.
 */

/** Indicadores subjetivos do acompanhamento (0–10). */
export interface FollowUpScales {
  adherence: number;
  hunger: number;
  sleep: number;
  energy: number;
  mood: number;
}

/** Circunferências corporais medidas (cm) — antropometria evolutiva. */
export type MeasurementKey = "waist" | "hip" | "abdomen" | "chest" | "arm" | "thigh";

/** Medidas de um acompanhamento — todas opcionais (o treinador registra o que medir). */
export type FollowUpMeasurements = Partial<Record<MeasurementKey, number>>;

/** Evolução de uma circunferência entre o primeiro e o último registro. */
export interface MeasurementDelta {
  key: MeasurementKey;
  first: number;
  last: number;
  deltaCm: number;
}

/** Um acompanhamento periódico do aluno. */
export interface FollowUp {
  id: string;
  studentId: string;
  /** Data do acompanhamento (yyyy-mm-dd). */
  date: string;
  weightKg: number;
  scales: FollowUpScales;
  /** Circunferências corporais medidas neste registro (opcional). */
  measurements: FollowUpMeasurements | null;
  /** Loop de aprendizado (Documento 05): o que funcionou / não funcionou / porquê. */
  whatWorked: string | null;
  whatFailed: string | null;
  why: string | null;
  createdAt: string;
}

/** Entrada para registrar um acompanhamento. */
export interface FollowUpInput {
  date: string;
  weightKg: number;
  scales: FollowUpScales;
  measurements: FollowUpMeasurements | null;
  whatWorked: string | null;
  whatFailed: string | null;
  why: string | null;
}

/** Status da evolução ante o previsto pela estratégia. */
export type EvolutionStatus =
  | "on_track"
  | "slow"
  | "fast"
  | "stalled"
  | "reversing"
  | "insufficient";

/** Um ponto de peso na linha do tempo. */
export interface WeightPoint {
  date: string;
  weightKg: number;
}

/** Síntese determinística da evolução (Documento 03F — previsão × real). */
export interface Evolution {
  startWeight: number;
  currentWeight: number;
  previousWeight: number | null;
  totalChangeKg: number;
  lastChangeKg: number | null;
  weeksElapsed: number;
  /** Ritmo real (kg/semana), sinalizado (negativo = perda). */
  actualWeeklyKg: number | null;
  /** Ritmo esperado (kg/semana) derivado dos macros. */
  expectedWeeklyKg: number;
  status: EvolutionStatus;
  points: WeightPoint[];
  averageScales: FollowUpScales | null;
}

/** Insight/recomendação do acompanhamento (liga ao plano de ajustes). */
export interface EvolutionInsight {
  id: string;
  kind: "risk" | "opportunity" | "recommendation";
  title: string;
  detail: string;
}
