import type { FlowStep, FlowStepId } from "@/modules/flow/types";

/** As 7 etapas do fluxo, na ordem (Workflow V1). */
export const FLOW_STEPS: FlowStep[] = [
  { id: "anamnese", order: 1, title: "Anamnese", short: "Entrevista inteligente do aluno." },
  { id: "diagnostico", order: 2, title: "Diagnóstico", short: "O dashboard executivo do caso." },
  { id: "estrategia", order: 3, title: "Estratégia", short: "Velocidade, calorias e macros." },
  { id: "alimentar", order: 4, title: "Estratégia alimentar", short: "A abordagem do plano." },
  { id: "cardapio", order: 5, title: "Cardápio", short: "As refeições do dia." },
  { id: "validacao", order: 6, title: "Validação", short: "Auditoria antes de entregar." },
  { id: "documento", order: 7, title: "Documento", short: "O plano profissional final." },
];

export const FLOW_STEP_IDS: FlowStepId[] = FLOW_STEPS.map((s) => s.id);

export function flowStepIndex(id: FlowStepId): number {
  return FLOW_STEP_IDS.indexOf(id);
}
