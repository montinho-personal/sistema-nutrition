import type { AuditGroup } from "@/modules/validation/types";

/** Limiares da auditoria (Doc 08 — sem número mágico; orientam, não bloqueiam). */
export const AUDIT_THRESHOLDS = {
  proteinMinGPerKg: 1.6,
  fiberMinFactor: 0.8, // fração da recomendação (14 g/1000 kcal) aceitável
  fiberGPer1000Kcal: 14,
  deficitMaxPct: 0.25, // acima disso, atenção
  surplusMaxPct: 0.2,
  distributionMinPct: 85,
  distributionMaxPct: 120,
  mealsMin: 3,
  mealsMax: 6,
  prepTotalMaxMin: 120, // preparo total do dia acima disso → atenção
  practicalityLow: 45,
  adherenceLow: 45,
  abandonmentHigh: 60,
} as const;

export const AUDIT_GROUP_LABELS: Record<AuditGroup, string> = {
  nutricao: "Nutrição",
  estrategia: "Estratégia e rotina",
  aderencia: "Aderência",
  contingencia: "Contingências",
};

export const AUDIT_GROUP_ORDER: AuditGroup[] = [
  "nutricao",
  "estrategia",
  "aderencia",
  "contingencia",
];
