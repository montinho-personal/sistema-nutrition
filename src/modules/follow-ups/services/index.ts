/** Serviços dos Acompanhamentos (Documentos 05, 03F). */

export {
  computeEvolution,
  buildEvolutionInsights,
  computeMeasurementDeltas,
  expectedWeeklyKgFromMacros,
} from "./evolutionEngine";
export { predictOutcome, type OutcomePredictionInput } from "./outcomePrediction";
export { listFollowUps, createFollowUp, deleteFollowUp } from "./followUpRepository";
export {
  summarizeAdherenceSignals,
  buildMemoryNarrative,
  type AdherenceSignals,
  type MemoryNarrative,
} from "./adherenceMemory";
