/**
 * Motor de Validação (Workflow V1 — Etapa 6): auditoria automática da estratégia
 * antes do documento. Determinístico (Doc 08); gera recomendações e nunca impede
 * continuar (Doc 02). Reaproveita os números já calculados (macros, plano, scores).
 */

import { AUDIT_THRESHOLDS as T } from "@/modules/validation/constants";
import type { AuditCheck, AuditReport } from "@/modules/validation/types";
import type { EnergyDirection } from "@/modules/strategy/types";
import type { ScoreKey } from "@/modules/diagnosis/types";
import type { Food } from "@/modules/foods/types";
import type { MealPlan } from "@/modules/meal-plan/types";

export interface AuditInput {
  calories: number;
  proteinG: number;
  tdee: number;
  direction: EnergyDirection;
  weightKg: number;
  plan: MealPlan;
  foods: Food[];
  scores: Record<ScoreKey, number>;
  mealsPerDay: number;
}

/** Fibra estimada do cardápio (g) a partir das gramas de cada item. */
function estimatePlanFiber(plan: MealPlan, foods: Food[]): number {
  const byId = new Map(foods.map((f) => [f.id, f]));
  let fiber = 0;
  for (const meal of plan.meals) {
    for (const item of meal.items) {
      const f = byId.get(item.foodId);
      if (f?.nutrition.fiberG) fiber += (item.grams * f.nutrition.fiberG) / 100;
    }
  }
  return Math.round(fiber);
}

/** Tempo total de preparo do cardápio (min), somando alimentos distintos. */
function estimatePrepMinutes(plan: MealPlan, foods: Food[]): number {
  const byId = new Map(foods.map((f) => [f.id, f]));
  const seen = new Set<string>();
  let minutes = 0;
  for (const meal of plan.meals) {
    for (const item of meal.items) {
      if (seen.has(item.foodId)) continue;
      seen.add(item.foodId);
      minutes += byId.get(item.foodId)?.attributes.prepTimeMinutes ?? 0;
    }
  }
  return minutes;
}

export function auditStrategy(input: AuditInput): AuditReport {
  const { calories, proteinG, tdee, direction, weightKg, plan, foods, scores, mealsPerDay } = input;
  const checks: AuditCheck[] = [];

  // ── Nutrição ────────────────────────────────────────────────────────────────
  const proteinPerKg = weightKg > 0 ? proteinG / weightKg : 0;
  checks.push({
    id: "protein",
    group: "nutricao",
    label: "Proteína suficiente",
    status: proteinPerKg >= T.proteinMinGPerKg ? "ok" : "attention",
    detail:
      proteinPerKg >= T.proteinMinGPerKg
        ? `${proteinPerKg.toFixed(1)} g/kg — adequada para preservar massa magra.`
        : `${proteinPerKg.toFixed(1)} g/kg — abaixo de ${T.proteinMinGPerKg} g/kg; considere elevar.`,
  });

  const fiber = estimatePlanFiber(plan, foods);
  const fiberRec = Math.round((calories / 1000) * T.fiberGPer1000Kcal);
  checks.push({
    id: "fiber",
    group: "nutricao",
    label: "Fibras suficientes",
    status: fiber >= fiberRec * T.fiberMinFactor ? "ok" : "attention",
    detail:
      fiber >= fiberRec * T.fiberMinFactor
        ? `~${fiber} g no cardápio (recomendado ~${fiberRec} g).`
        : `~${fiber} g — abaixo do recomendado (~${fiberRec} g); inclua mais vegetais/integrais.`,
  });

  // ── Estratégia e rotina ──────────────────────────────────────────────────────
  if (direction === "deficit") {
    const pct = tdee > 0 ? (tdee - calories) / tdee : 0;
    checks.push({
      id: "deficit",
      group: "estrategia",
      label: "Déficit compatível",
      status: pct <= T.deficitMaxPct ? "ok" : "attention",
      detail: `${Math.round(pct * 100)}% do gasto${pct <= T.deficitMaxPct ? " — dentro do sustentável." : " — elevado; monitore fome e energia."}`,
    });
  } else if (direction === "superavit") {
    const pct = tdee > 0 ? (calories - tdee) / tdee : 0;
    checks.push({
      id: "surplus",
      group: "estrategia",
      label: "Superávit adequado",
      status: pct <= T.surplusMaxPct ? "ok" : "attention",
      detail: `${Math.round(pct * 100)}% acima do gasto${pct <= T.surplusMaxPct ? " — controlado." : " — alto; parte do ganho pode ser gordura."}`,
    });
  } else {
    checks.push({
      id: "energy",
      group: "estrategia",
      label: "Energia na manutenção",
      status: "ok",
      detail: "Calorias alinhadas ao gasto total.",
    });
  }

  const within =
    plan.accuracy.protein >= T.distributionMinPct &&
    plan.accuracy.protein <= T.distributionMaxPct &&
    plan.accuracy.carbs >= T.distributionMinPct &&
    plan.accuracy.carbs <= T.distributionMaxPct &&
    plan.accuracy.fat >= T.distributionMinPct &&
    plan.accuracy.fat <= T.distributionMaxPct;
  checks.push({
    id: "distribution",
    group: "estrategia",
    label: "Distribuição faz sentido",
    status: within ? "ok" : "attention",
    detail: within
      ? "Cada macro do cardápio está perto do alvo."
      : `Algum macro está fora do alvo (P${plan.accuracy.protein}% C${plan.accuracy.carbs}% G${plan.accuracy.fat}%); ajuste as porções ou troque alimentos.`,
  });

  checks.push({
    id: "meals",
    group: "estrategia",
    label: "Número de refeições adequado",
    status: mealsPerDay >= T.mealsMin && mealsPerDay <= T.mealsMax ? "ok" : "attention",
    detail: `${mealsPerDay} refeições/dia${mealsPerDay >= T.mealsMin && mealsPerDay <= T.mealsMax ? " — compatível com a maioria das rotinas." : " — reavalie para a rotina do aluno."}`,
  });

  const prep = estimatePrepMinutes(plan, foods);
  const practicalityLow = scores.practicality < T.practicalityLow;
  checks.push({
    id: "prep",
    group: "estrategia",
    label: "Preparo compatível com a rotina",
    status: prep > T.prepTotalMaxMin && practicalityLow ? "attention" : "ok",
    detail:
      prep > T.prepTotalMaxMin && practicalityLow
        ? `~${prep} min de preparo/dia com rotina apertada; priorize alimentos práticos.`
        : `~${prep} min de preparo/dia — viável.`,
  });

  // ── Aderência ────────────────────────────────────────────────────────────────
  const adherenceRisk =
    scores.adherence < T.adherenceLow || scores.abandonmentRisk > T.abandonmentHigh;
  checks.push({
    id: "adherence",
    group: "aderencia",
    label: "Risco de baixa aderência",
    status: adherenceRisk ? "attention" : "ok",
    detail: adherenceRisk
      ? "Sinais de aderência frágil — prefira metas menores e acompanhamento próximo."
      : "Perfil sustenta bem a estratégia proposta.",
  });

  checks.push({
    id: "rejected",
    group: "aderencia",
    label: "Alimentos rejeitados evitados",
    status: "ok",
    detail: "O cardápio respeita as restrições informadas na anamnese.",
  });

  // ── Contingências (lembretes — sempre revisar) ───────────────────────────────
  checks.push({
    id: "weekend",
    group: "contingencia",
    label: "Plano para os finais de semana",
    status: "review",
    detail: "Deixe combinado como conduzir os finais de semana (refeição livre, limites).",
  });
  checks.push({
    id: "travel",
    group: "contingencia",
    label: "Plano para viagens",
    status: "review",
    detail: "Inclua orientações práticas para dias de viagem e alimentação fora.",
  });
  checks.push({
    id: "supplements",
    group: "contingencia",
    label: "Suplementos sem excesso",
    status: "review",
    detail: "Revise a suplementação — priorize comida real e o essencial.",
  });
  checks.push({
    id: "plan_b",
    group: "contingencia",
    label: "Plano B para dias fora da rotina",
    status: "review",
    detail: "Tenha uma versão simplificada para os dias em que o plano ideal não couber.",
  });

  const summary = checks.reduce(
    (acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }),
    { ok: 0, attention: 0, review: 0 },
  );

  return { checks, summary };
}
