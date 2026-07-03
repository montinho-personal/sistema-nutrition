/** Serviços do Módulo 1 — Diagnóstico Estratégico. */

export { computeScores, computeScoreMap, computeOverallConfidence } from "./scoringEngine";
export { computeHypotheses } from "./hypothesisEngine";
export {
  buildDiagnosisDashboard,
  type DiagnosisDashboard,
  type DiagnosisDashboardInput,
  type DifficultyLevel,
} from "./diagnosisDashboard";
export {
  buildAnamnesePortrait,
  type PortraitGroup,
  type PortraitItem,
} from "./anamnesePortrait";
export {
  analyzeRecordatorio,
  type RecordatorioAnalysis,
  type RecordatorioObservation,
  type MealReading,
} from "./recordatorioAnalysis";
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
export {
  isAnamneseSyncEnabled,
  submitAnamnese,
  fetchLatestAnamnese,
  consumeAnamnese,
  type AnamneseSubmission,
} from "./anamneseSync";
