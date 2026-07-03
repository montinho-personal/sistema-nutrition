/**
 * Abordagens alimentares (Workflow V1 — Etapa 4). As 5 principais da v1. Cada
 * abordagem molda a distribuição de macros e/ou as refeições — as calorias-alvo
 * seguem da estratégia. Parâmetros configuráveis (Doc 08 — sem número mágico).
 */

import type { DietApproach, DietApproachId } from "@/modules/strategy/types";
import type { StudentGoal } from "@/modules/students/types";

export const DIET_APPROACHES: Record<DietApproachId, DietApproach> = {
  tradicional: {
    id: "tradicional",
    label: "Tradicional",
    emphasis: "Equilíbrio",
    description:
      "Distribuição equilibrada de proteína, carboidrato e gordura. Simples de seguir e sustentável no longo prazo.",
  },
  flexivel: {
    id: "flexivel",
    label: "Flexível",
    emphasis: "Liberdade",
    description:
      "Mesma base equilibrada, com liberdade de escolha dos alimentos dentro dos macros. Melhor adesão para a maioria.",
  },
  low_carb: {
    id: "low_carb",
    label: "Low Carb",
    emphasis: "Menos carboidrato",
    description:
      "Carboidrato reduzido, com mais gordura no lugar. Útil para saciedade e controle da fome.",
    carbMaxGPerKg: 1.5,
  },
  alta_proteina: {
    id: "alta_proteina",
    label: "Alta Proteína",
    emphasis: "Mais proteína",
    description:
      "Proteína elevada para preservar/ganhar massa magra e aumentar a saciedade, ajustando o carboidrato.",
    proteinGPerKg: 2.4,
  },
  jejum: {
    id: "jejum",
    label: "Jejum Intermitente",
    emphasis: "Janela alimentar",
    description:
      "Mesmos macros concentrados em menos refeições, numa janela alimentar. Prático para rotinas corridas.",
    meals: 3,
  },
};

/** Ordem de exibição das abordagens. */
export const DIET_APPROACH_ORDER: DietApproachId[] = [
  "tradicional",
  "flexivel",
  "low_carb",
  "alta_proteina",
  "jejum",
];

/** Abordagem sugerida por padrão, a partir do objetivo do aluno. */
export const SUGGESTED_APPROACH_BY_GOAL: Record<StudentGoal, DietApproachId> = {
  weight_loss: "flexivel",
  hypertrophy: "alta_proteina",
  recomposition: "alta_proteina",
  maintenance: "tradicional",
  performance: "tradicional",
  health: "tradicional",
  event_preparation: "low_carb",
};
