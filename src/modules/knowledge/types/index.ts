/**
 * Base de Conhecimento (V2 — #3). Repositório de princípios e protocolos que
 * embasam as decisões do sistema. As justificativas deixam de ser texto solto
 * no código e passam a apontar para uma fonte rastreável (Documento 00 —
 * transparência; Documento 12 — a IA/decisão sempre justificada).
 */

/** Natureza da fonte que sustenta um princípio. */
export type KnowledgeSourceKind =
  | "guideline"
  | "meta_analysis"
  | "rct"
  | "review"
  | "consensus"
  | "textbook";

export interface KnowledgeSource {
  label: string;
  kind: KnowledgeSourceKind;
}

/** Categoria temática do conhecimento. */
export type KnowledgeCategory =
  | "estrategia"
  | "comportamento"
  | "saciedade"
  | "ajustes"
  | "hidratacao"
  | "sono"
  | "treino"
  | "suplementacao";

/** Uma entrada da base: um princípio com aplicação prática e fontes. */
export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  /** O princípio em si — o que a evidência diz. */
  principle: string;
  /** Como o sistema aplica isso na prática. */
  application: string;
  sources: KnowledgeSource[];
  tags: string[];
}

/** Referência enxuta a uma entrada (para anexar a decisões/hipóteses). */
export interface KnowledgeReference {
  id: string;
  title: string;
  source: string;
}
