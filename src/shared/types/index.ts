/**
 * Tipos globais do Montinho Nutrition Strategy.
 * Tipos de domínio específicos vivem em cada módulo (`modules/<dominio>/types`).
 */

/** Identificador UUID padrão do banco (Documento 10). */
export type Uuid = string;

/** Campos de auditoria obrigatórios em toda entidade (Documento 10). */
export interface AuditFields {
  id: Uuid;
  createdAt: string;
  updatedAt: string;
  createdBy: Uuid | null;
  updatedBy: Uuid | null;
  isActive: boolean;
  notes: string | null;
}

/** Escala qualitativa padrão do sistema (Documento 07). */
export type QualitativeScale = "low" | "moderate" | "high" | "very_high";

/** Nível de evidência científica (Documento 03G — Banco Científico). */
export type EvidenceLevel = "strong" | "moderate" | "limited" | "expert_opinion";

/** Resultado paginado padrão. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
