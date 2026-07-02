/** Serviços do Módulo 1 — Diagnóstico Estratégico. */

export { computeScores, computeScoreMap, computeOverallConfidence } from "./scoringEngine";
export { computeHypotheses } from "./hypothesisEngine";
export {
  buildExecutiveSummary,
  ageFromBirthDate,
  type StudentSummaryContext,
} from "./executiveSummary";
export {
  getSessionForStudent,
  getOrCreateSession,
  saveSession,
  saveAnswers,
  applyImportedAnswers,
} from "./diagnosisRepository";
export {
  encodeAnamnese,
  decodeAnamnese,
  buildAnamneseUrl,
  type AnamnesePayload,
} from "./shareCodec";
