/**
 * Documento Premium (Workflow V1 — Etapa 7): consolida diagnóstico, estratégia,
 * macros e cardápio num documento profissional, e gera as peças novas (mensagem,
 * lista de compras, justificativa). Determinístico (Doc 08), reaproveitando os
 * motores existentes (Doc 17 — reutilizar, nunca reconstruir).
 */

import {
  NEXT_STEPS,
  PLAN_B_TIPS,
  RESTAURANT_TIPS,
  SCHEDULE_STEPS,
  SLEEP_TIPS,
  SUPPLEMENT_TIPS,
  TRAVEL_TIPS,
  WEEKEND_TIPS,
} from "@/modules/reports/constants/premiumGuidance";
import type { DiagnosisDashboard, DifficultyLevel } from "@/modules/diagnosis/services";
import type { Food } from "@/modules/foods/types";
import type { MealPlan, PlannedMeal } from "@/modules/meal-plan/types";

export interface PremiumDocInput {
  firstName: string;
  studentName: string;
  goalLabel: string;
  ageYears: number | null;
  generatedAt: string;
  velocityLabel: string;
  directionLabel: string;
  approachLabel: string;
  approachEmphasis: string;
  mealsPerDay: number;
  macros: { calories: number; proteinG: number; carbG: number; fatG: number };
  dashboard: DiagnosisDashboard;
  plan: MealPlan;
  foods: Food[];
}

export interface ShoppingGroup {
  category: string;
  items: { name: string; grams: number }[];
}

export interface PremiumDoc {
  message: string;
  diagnosis: { parecer: string; strengths: string[]; weaknesses: string[] };
  objectives: { main: string | null; secondary: string[] };
  strategy: {
    justification: string;
    velocity: string;
    direction: string;
    approach: string;
    approachEmphasis: string;
    mealsPerDay: number;
  };
  macros: { calories: number; proteinG: number; carbG: number; fatG: number };
  meals: PlannedMeal[];
  shoppingList: ShoppingGroup[];
  hydrationL: number | null;
  guidance: {
    restaurant: string[];
    travel: string[];
    weekend: string[];
    planB: string[];
    sleep: string[];
    supplements: string[];
  };
  schedule: string[];
  nextSteps: string[];
}

const DIFFICULTY_CLOSER: Record<DifficultyLevel, string> = {
  alto: "Vamos com um ritmo firme e sustentável — pequenas vitórias, uma de cada vez.",
  medio: "O caminho é a consistência: siga o plano na maioria dos dias e ajustamos juntos.",
  baixo: "Você tem tudo para ir longe — bora transformar isso em resultado.",
};

/** Agrega os itens do cardápio numa lista de compras (soma por alimento, por categoria). */
function buildShoppingList(plan: MealPlan, foods: Food[]): ShoppingGroup[] {
  const byId = new Map(foods.map((f) => [f.id, f]));
  const totals = new Map<string, { category: string; name: string; grams: number }>();
  for (const meal of plan.meals) {
    for (const item of meal.items) {
      const food = byId.get(item.foodId);
      const entry = totals.get(item.foodId);
      if (entry) entry.grams += item.grams;
      else
        totals.set(item.foodId, {
          category: food?.categoryName ?? "Outros",
          name: item.foodName,
          grams: item.grams,
        });
    }
  }
  const groups = new Map<string, { name: string; grams: number }[]>();
  for (const { category, name, grams } of totals.values()) {
    const list = groups.get(category) ?? [];
    list.push({ name, grams });
    groups.set(category, list);
  }
  return Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function buildPremiumDocument(input: PremiumDocInput): PremiumDoc {
  const opener = input.firstName ? `Olá, ${input.firstName}!` : "Olá!";
  const message =
    `${opener} Este é o seu plano de ${input.goalLabel.toLowerCase()}, montado a partir da sua ` +
    `rotina, das suas preferências e do seu momento. ${DIFFICULTY_CLOSER[input.dashboard.difficulty.level]}`;

  const justification =
    `A estratégia combina uma velocidade ${input.velocityLabel.toLowerCase()} com a abordagem ` +
    `${input.approachLabel} (${input.approachEmphasis.toLowerCase()}), distribuída em ${input.mealsPerDay} ` +
    `refeições por dia. As calorias e os macros foram calculados para sustentar o objetivo ` +
    `(${input.directionLabel.toLowerCase()}) preservando a massa magra e a sua aderência.`;

  return {
    message,
    diagnosis: {
      parecer: input.dashboard.parecer,
      strengths: input.dashboard.strengths,
      weaknesses: input.dashboard.weaknesses,
    },
    objectives: input.dashboard.objectives,
    strategy: {
      justification,
      velocity: input.velocityLabel,
      direction: input.directionLabel,
      approach: input.approachLabel,
      approachEmphasis: input.approachEmphasis,
      mealsPerDay: input.mealsPerDay,
    },
    macros: input.macros,
    meals: input.plan.meals,
    shoppingList: buildShoppingList(input.plan, input.foods),
    hydrationL: input.dashboard.estimates.recommendedWaterMl
      ? Math.round((input.dashboard.estimates.recommendedWaterMl / 1000) * 10) / 10
      : null,
    guidance: {
      restaurant: RESTAURANT_TIPS,
      travel: TRAVEL_TIPS,
      weekend: WEEKEND_TIPS,
      planB: PLAN_B_TIPS,
      sleep: SLEEP_TIPS,
      supplements: SUPPLEMENT_TIPS,
    },
    schedule: SCHEDULE_STEPS,
    nextSteps: NEXT_STEPS,
  };
}
