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

/** Veredito da previsão de resultado ante a meta (Documento 03F). */
export type PredictionVerdict =
  | "ahead"
  | "on_track"
  | "behind"
  | "stalled"
  | "reversing"
  | "insufficient";

/**
 * Previsão de resultado (Outcome Prediction Engine — Documento 03F).
 * Projeta o desfecho provável a partir do ritmo REAL medido, comparando com a
 * meta do plano (Definição Estratégica). Recalibra a cada acompanhamento.
 */
export interface OutcomePrediction {
  /** Ritmo real (kg/semana, sinalizado) — base da projeção. */
  realWeeklyKg: number | null;
  /** Mudança projetada até a data-alvo, no ritmo atual (sinalizada). */
  projectedChangeKg: number;
  /** Peso projetado na data-alvo. */
  projectedWeightAtTarget: number;
  /** Mudança planejada (sinalizada) e o prazo (semanas). */
  plannedChangeKg: number;
  targetWeeks: number;
  /** Fração da meta que o ritmo atual entrega no prazo (%). */
  onTrackPct: number;
  /** Semanas até bater a meta no ritmo atual (ou null). */
  weeksToGoal: number | null;
  /** Diferença entre planejado e projetado no prazo (kg; + = vai faltar). */
  gapKg: number;
  verdict: PredictionVerdict;
  /** Confiança da previsão (0–100): mais dados e mais tempo → maior. */
  confidence: number;
  /** Recomendação acionável (Documento 02 — nunca só o número). */
  detail: string;
}
