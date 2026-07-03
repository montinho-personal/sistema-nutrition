/**
 * Tipos da Validação da Estratégia (Workflow V1 — Etapa 6). Auditoria que
 * orienta, nunca bloqueia (Doc 02).
 */

/** Resultado de um item da auditoria. */
export type AuditStatus = "ok" | "attention" | "review";

/** Grupo do item — organiza a leitura. */
export type AuditGroup = "nutricao" | "estrategia" | "aderencia" | "contingencia";

export interface AuditCheck {
  id: string;
  group: AuditGroup;
  label: string;
  status: AuditStatus;
  detail: string;
}

export interface AuditReport {
  checks: AuditCheck[];
  summary: { ok: number; attention: number; review: number };
}
