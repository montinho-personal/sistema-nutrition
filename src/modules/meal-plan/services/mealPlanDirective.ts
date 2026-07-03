/**
 * Instrução do treinador em linguagem natural (Personal Nutrition AI — Fatia A).
 *
 * O treinador escreve como falaria ("1700 kcal, sem carboidrato à noite, mais
 * barato") e o sistema traduz a intenção em restrições estruturadas que ajustam
 * o motor determinístico — sem reescrever a estratégia (Documento 08: regra é a
 * base; a instrução só afina o contexto). Este parser resolve os casos comuns de
 * forma determinística; a camada de IA (Fatia A.2) cobre o que o texto esconde,
 * devolvendo a MESMA estrutura — o motor é agnóstico à origem.
 */

import type { MacroTotals, MealPlanDirective } from "@/modules/meal-plan/types";
import type { MealPlanContext } from "@/modules/meal-plan/services/mealPlanEngine";
import { DIRECTIVE_LIMITS } from "@/modules/meal-plan/constants/parameters";

/** Atwater — kcal por grama, para redistribuir os macros ao trocar as calorias. */
const KCAL_PER_G = { protein: 4, carb: 4, fat: 9 } as const;

/** Diretiva vazia (nada reconhecido). */
export function emptyDirective(): MealPlanDirective {
  return {
    caloriesOverride: null,
    mealsPerDay: null,
    budgetTight: false,
    emphasizePracticality: false,
    emphasizeSatiety: false,
    noCarbAtNight: false,
    addRestrictions: [],
    recognized: [],
  };
}

/** true se a instrução mudou algo — caso contrário, o cardápio segue como está. */
export function hasDirective(d: MealPlanDirective): boolean {
  return (
    d.caloriesOverride !== null ||
    d.mealsPerDay !== null ||
    d.budgetTight ||
    d.emphasizePracticality ||
    d.emphasizeSatiety ||
    d.noCarbAtNight ||
    d.addRestrictions.length > 0
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Minúsculas sem acento — casa "à noite" com "a noite", "glúten" com "gluten". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Interpreta a instrução em linguagem natural de forma determinística. Reconhece
 * calorias, nº de refeições, "sem carbo à noite", dieta barata, refeições
 * rápidas, foco em saciedade e restrições comuns (sem lactose/glúten,
 * vegetariano/vegano).
 */
export function parseDirective(text: string): MealPlanDirective {
  const d = emptyDirective();
  const t = normalize(text);
  if (!t.trim()) return d;

  const add = (phrase: string) => {
    if (!d.recognized.includes(phrase)) d.recognized.push(phrase);
  };

  const kcal = t.match(/(\d{3,4})\s*(kcal|calorias|cal)\b/);
  if (kcal) {
    d.caloriesOverride = clamp(
      Number.parseInt(kcal[1], 10),
      DIRECTIVE_LIMITS.minCalories,
      DIRECTIVE_LIMITS.maxCalories,
    );
    add(`${d.caloriesOverride} kcal`);
  }

  const meals = t.match(/(\d)\s*refei/);
  if (meals) {
    d.mealsPerDay = clamp(
      Number.parseInt(meals[1], 10),
      DIRECTIVE_LIMITS.minMeals,
      DIRECTIVE_LIMITS.maxMeals,
    );
    add(`${d.mealsPerDay} refeições`);
  }

  // "zero/sem/pouco carbo" + "à noite/jantar/ceia" — as duas ideias juntas.
  if (/(zero|sem|pouco|low|baix\w*)\s*carbo/.test(t) && /(noite|jantar|ceia)/.test(t)) {
    d.noCarbAtNight = true;
    add("sem carboidrato à noite");
  }

  if (/(barat|econom|em conta|gastar pouco|acessivel|pouco dinheiro)/.test(t)) {
    d.budgetTight = true;
    add("dieta barata");
  }

  if (/(rapid|pratic|sem cozinhar|sem preparo|facil de fazer|shake|sanduich|marmita)/.test(t)) {
    d.emphasizePracticality = true;
    add("refeições rápidas");
  }

  if (/(sacied|matar a fome|controlar a fome|menos fome|mais cheio|segura a fome)/.test(t)) {
    d.emphasizeSatiety = true;
    add("mais saciedade");
  }

  const restrict = (id: string, label: string) => {
    if (!d.addRestrictions.includes(id)) d.addRestrictions.push(id);
    add(label);
  };
  if (/(sem|zero|intoleran\w*\s*a?)\s*lactose/.test(t)) restrict("sem_lactose", "sem lactose");
  if (/(sem|zero)\s*gluten|celiac/.test(t)) restrict("sem_gluten", "sem glúten");
  if (/vegan/.test(t)) restrict("vegano", "vegano");
  else if (/vegetarian/.test(t)) restrict("vegetariano", "vegetariano");

  return d;
}

/**
 * Recalcula os macros para uma nova meta calórica mantendo a proteína (alvo duro
 * de massa magra); carboidrato e gordura absorvem a diferença na proporção atual
 * — mesma filosofia da abordagem alimentar.
 */
export function overrideCalories(macros: MacroTotals, kcal: number): MacroTotals {
  const proteinKcal = macros.protein * KCAL_PER_G.protein;
  const remaining = Math.max(0, kcal - proteinKcal);
  const carbKcal = macros.carbs * KCAL_PER_G.carb;
  const fatKcal = macros.fat * KCAL_PER_G.fat;
  const denom = carbKcal + fatKcal;
  const carbShare = denom > 0 ? carbKcal / denom : 0.6;
  return {
    kcal,
    protein: macros.protein,
    carbs: Math.round((remaining * carbShare) / KCAL_PER_G.carb),
    fat: Math.round((remaining * (1 - carbShare)) / KCAL_PER_G.fat),
  };
}

/**
 * Aplica a diretiva ao contexto do cardápio — retorna um novo contexto (nunca
 * muta). O que a instrução não menciona segue como a estratégia definiu.
 */
export function applyDirective(ctx: MealPlanContext, d: MealPlanDirective): MealPlanContext {
  const next: MealPlanContext = { ...ctx };
  if (d.caloriesOverride) next.macros = overrideCalories(ctx.macros, d.caloriesOverride);
  if (d.mealsPerDay) next.mealsPerDay = d.mealsPerDay;
  if (d.budgetTight) next.budgetTight = true;
  if (d.emphasizePracticality) next.emphasizePracticality = true;
  if (d.emphasizeSatiety) next.emphasizeSatiety = true;
  if (d.noCarbAtNight) next.noCarbAtNight = true;
  if (d.addRestrictions.length > 0) {
    next.restrictions = Array.from(new Set([...ctx.restrictions, ...d.addRestrictions]));
  }
  return next;
}
