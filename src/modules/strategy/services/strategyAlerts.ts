/**
 * Motor de alertas inteligentes da estratégia (Workflow V1 — Etapa 3). Avalia os
 * macros à luz do contexto e devolve avisos 🟢🟡🟠🔴 — determinísticos e
 * auditáveis (Doc 08). Orientam, nunca bloqueiam (Doc 02).
 */

import { STRATEGY_ALERT_THRESHOLDS as T } from "@/modules/strategy/constants/parameters";
import type { EnergyDirection } from "@/modules/strategy/types";

/** 🟢 green · 🟡 yellow · 🟠 orange · 🔴 red */
export type AlertLevel = "green" | "yellow" | "orange" | "red";

export interface StrategyAlert {
  level: AlertLevel;
  title: string;
  detail: string;
}

export interface StrategyAlertInput {
  calories: number;
  proteinG: number;
  fatG: number;
  tdee: number;
  weightKg: number;
  direction: EnergyDirection;
  trainsRegularly: boolean;
}

const SEVERITY: Record<AlertLevel, number> = { red: 3, orange: 2, yellow: 1, green: 0 };

/**
 * Alertas da estratégia atual, do mais grave ao mais leve. Quando nada
 * preocupa, devolve um único alerta verde ("excelente estratégia").
 */
export function evaluateStrategyAlerts(input: StrategyAlertInput): StrategyAlert[] {
  const { calories, proteinG, fatG, tdee, weightKg, direction, trainsRegularly } = input;
  const alerts: StrategyAlert[] = [];

  const proteinPerKg = weightKg > 0 ? proteinG / weightKg : null;
  const fatPerKg = weightKg > 0 ? fatG / weightKg : null;

  // Proteína — o principal fator contra a perda de músculo.
  if (proteinPerKg !== null) {
    if (proteinPerKg < T.proteinCriticalGPerKg) {
      alerts.push({
        level: "red",
        title: "Alto risco de perda muscular",
        detail: `Proteína de ${proteinPerKg.toFixed(1)} g/kg está muito abaixo do seguro (mín. ${T.proteinLowGPerKg} g/kg).`,
      });
    } else if (proteinPerKg < T.proteinLowGPerKg) {
      alerts.push({
        level: "orange",
        title: "Proteína abaixo do recomendado",
        detail: `${proteinPerKg.toFixed(1)} g/kg — o ideal é pelo menos ${T.proteinLowGPerKg} g/kg para preservar massa magra.`,
      });
    }
  }

  // Gordura — piso para suporte hormonal.
  if (fatPerKg !== null && fatPerKg < T.fatFloorGPerKg) {
    alerts.push({
      level: "orange",
      title: "Gordura abaixo do mínimo",
      detail: `${fatPerKg.toFixed(1)} g/kg — abaixo de ${T.fatFloorGPerKg} g/kg pode afetar o suporte hormonal.`,
    });
  }

  // Profundidade do déficit / superávit.
  if (tdee > 0 && direction === "deficit") {
    const pct = (tdee - calories) / tdee;
    if (pct >= T.deficitCritical) {
      alerts.push({
        level: "red",
        title: "Déficit muito agressivo",
        detail: `${Math.round(pct * 100)}% do gasto — fome intensa, queda de energia e risco à aderência.`,
      });
    } else if (pct >= T.deficitHigh) {
      alerts.push({
        level: "orange",
        title: "Déficit elevado",
        detail: `${Math.round(pct * 100)}% do gasto — sustentável só com boa aderência e proteína alta.`,
      });
    } else if (pct >= T.deficitAttention) {
      alerts.push({
        level: "yellow",
        title: "Déficit moderado-alto",
        detail: `${Math.round(pct * 100)}% do gasto — dentro do razoável, mas monitore fome e energia.`,
      });
    }
  }

  if (tdee > 0 && direction === "superavit") {
    const pct = (calories - tdee) / tdee;
    if (pct >= T.surplusHigh) {
      alerts.push({
        level: "orange",
        title: "Superávit alto",
        detail: `${Math.round(pct * 100)}% acima do gasto — o excedente tende a virar gordura, não músculo.`,
      });
    } else if (pct >= T.surplusAttention) {
      alerts.push({
        level: "yellow",
        title: "Superávit acima do ideal",
        detail: `${Math.round(pct * 100)}% acima do gasto — parte do ganho pode ser gordura.`,
      });
    }
  }

  // Combinação de risco: déficit sem treino de força agrava a perda muscular.
  if (direction === "deficit" && !trainsRegularly && proteinPerKg !== null && proteinPerKg < T.proteinLowGPerKg) {
    alerts.push({
      level: "red",
      title: "Perda muscular provável",
      detail: "Déficit com proteína baixa e sem treino de força regular — combinação que consome músculo.",
    });
  }

  if (alerts.length === 0) {
    return [
      {
        level: "green",
        title: "Excelente estratégia",
        detail: "Proteína, energia e gordura estão equilibradas para o objetivo.",
      },
    ];
  }

  return alerts.sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level]);
}
