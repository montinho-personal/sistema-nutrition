import type { KnowledgeCategory, KnowledgeSourceKind } from "@/modules/knowledge/types";

/** Rótulos pt-BR das categorias (ordem de exibição). */
export const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  estrategia: "Estratégia",
  comportamento: "Comportamento",
  saciedade: "Saciedade",
  ajustes: "Ajustes",
  hidratacao: "Hidratação",
  sono: "Sono",
  treino: "Treino",
  suplementacao: "Suplementação",
};

export const CATEGORY_ORDER: KnowledgeCategory[] = [
  "estrategia",
  "comportamento",
  "saciedade",
  "ajustes",
  "treino",
  "hidratacao",
  "sono",
  "suplementacao",
];

/** Rótulos pt-BR do tipo de fonte (força da evidência, do mais forte ao menos). */
export const SOURCE_KIND_LABELS: Record<KnowledgeSourceKind, string> = {
  meta_analysis: "Meta-análise",
  rct: "Ensaio clínico",
  guideline: "Diretriz",
  consensus: "Consenso",
  review: "Revisão",
  textbook: "Referência",
};
