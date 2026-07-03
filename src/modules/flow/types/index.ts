/**
 * Tipos do Fluxo (Workflow V1 — Doc 00/02): um percurso guiado de 7 etapas que
 * costura os módulos existentes num só caminho, do primeiro dado ao documento.
 */

export type FlowStepId =
  | "anamnese"
  | "diagnostico"
  | "estrategia"
  | "alimentar"
  | "cardapio"
  | "validacao"
  | "documento";

/** Estado visual de uma etapa no stepper. */
export type FlowStepStatus = "done" | "current" | "todo" | "locked";

/** Definição estática de uma etapa. */
export interface FlowStep {
  id: FlowStepId;
  /** Número exibido (1..7). */
  order: number;
  title: string;
  /** Frase curta do objetivo da etapa. */
  short: string;
}

/** Registro persistido do progresso do fluxo de um aluno. */
export interface FlowState {
  studentId: string;
  /** Última etapa em que o profissional estava. */
  stepId: FlowStepId;
  updatedAt: string;
}
