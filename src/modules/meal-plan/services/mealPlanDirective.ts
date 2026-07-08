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

import type {
  MacroTotals,
  MealPlanDirective,
  MealPlanPref,
  MealSlot,
} from "@/modules/meal-plan/types";
import type { MealPlanContext } from "@/modules/meal-plan/services/mealPlanEngine";
import { RESTRICTION_LABELS } from "@/modules/meal-plan/services/dietaryFilters";
import { DIRECTIVE_LIMITS } from "@/modules/meal-plan/constants/parameters";

/** Atwater — kcal por grama, para redistribuir os macros ao trocar as calorias. */
const KCAL_PER_G = { protein: 4, carb: 4, fat: 9 } as const;

/** Rótulo curto de cada refeição, para os chips "Café: aveia, whey...". */
const MEAL_SLOT_SHORT: Record<MealSlot, string> = {
  breakfast: "Café",
  morning_snack: "Lanche da manhã",
  lunch: "Almoço",
  afternoon_snack: "Lanche da tarde",
  dinner: "Jantar",
  supper: "Ceia",
};

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
    mealFoods: {},
    recognized: [],
    unsupported: [],
  };
}

/**
 * Descreve, em frases legíveis, o que a diretiva representa — fonte única de
 * verdade das "tags" da interface. Assim os chips nunca divergem do que de fato
 * foi aplicado, venha do parser determinístico ou da IA.
 */
export function describeDirective(d: MealPlanDirective): string[] {
  const out: string[] = [];
  if (d.caloriesOverride) out.push(`${d.caloriesOverride} kcal`);
  if (d.mealsPerDay) out.push(`${d.mealsPerDay} refeições`);
  if (d.noCarbAtNight) out.push("sem carboidrato à noite");
  if (d.budgetTight) out.push("dieta barata");
  if (d.emphasizePracticality) out.push("refeições rápidas");
  if (d.emphasizeSatiety) out.push("mais saciedade");
  for (const r of d.addRestrictions) out.push(RESTRICTION_LABELS[r] ?? r);
  for (const [slot, foods] of Object.entries(d.mealFoods)) {
    if (foods && foods.length > 0)
      out.push(`${MEAL_SLOT_SHORT[slot as MealSlot]}: ${foods.join(", ")}`);
  }
  return out;
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
    d.addRestrictions.length > 0 ||
    Object.keys(d.mealFoods).length > 0
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

/** Descobre a refeição a partir do rótulo antes dos dois-pontos ("Café", "Janta"). */
function mealSlotFromLabel(labelNorm: string): MealSlot | null {
  if (/lanche.*manh|manh.*lanche/.test(labelNorm)) return "morning_snack";
  if (/lanche|tarde/.test(labelNorm)) return "afternoon_snack";
  if (/caf|desjejum|manh/.test(labelNorm)) return "breakfast";
  if (/almoc/.test(labelNorm)) return "lunch";
  if (/jant|noite/.test(labelNorm)) return "dinner";
  if (/ceia/.test(labelNorm)) return "supper";
  return null;
}

/**
 * Extrai os alimentos pedidos por refeição de linhas "Refeição: a, b e c".
 * Preserva os nomes como o treinador escreveu (o motor resolve para o banco).
 */
function parseMealFoods(text: string): Partial<Record<MealSlot, string[]>> {
  const out: Partial<Record<MealSlot, string[]>> = {};
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const slot = mealSlotFromLabel(normalize(line.slice(0, idx)));
    if (!slot) continue;
    const foods = line
      .slice(idx + 1)
      .split(/\s*,\s*|\s+e\s+|\s*;\s*/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    if (foods.length > 0) out[slot] = foods;
  }
  return out;
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

  const kcal = t.match(/(\d{3,4})\s*(kcal|calorias|cal)\b/);
  if (kcal) {
    d.caloriesOverride = clamp(
      Number.parseInt(kcal[1], 10),
      DIRECTIVE_LIMITS.minCalories,
      DIRECTIVE_LIMITS.maxCalories,
    );
  }

  const meals = t.match(/(\d)\s*refei/);
  if (meals) {
    d.mealsPerDay = clamp(
      Number.parseInt(meals[1], 10),
      DIRECTIVE_LIMITS.minMeals,
      DIRECTIVE_LIMITS.maxMeals,
    );
  }

  // "zero/sem/pouco carbo" + "à noite/jantar/ceia" — as duas ideias juntas.
  if (/(zero|sem|pouco|low|baix\w*)\s*carbo/.test(t) && /(noite|jantar|ceia)/.test(t))
    d.noCarbAtNight = true;

  if (/(barat|econom|em conta|gastar pouco|acessivel|pouco dinheiro)/.test(t)) d.budgetTight = true;

  if (/(rapid|pratic|sem cozinhar|sem preparo|facil de fazer|shake|sanduich|marmita)/.test(t))
    d.emphasizePracticality = true;

  if (/(sacied|matar a fome|controlar a fome|menos fome|mais cheio|segura a fome)/.test(t))
    d.emphasizeSatiety = true;

  if (/(sem|zero|intoleran\w*\s*a?)\s*lactose/.test(t)) d.addRestrictions.push("sem_lactose");
  if (/(sem|zero)\s*gluten|celiac/.test(t)) d.addRestrictions.push("sem_gluten");
  if (/vegan/.test(t)) d.addRestrictions.push("vegano");
  else if (/vegetarian/.test(t)) d.addRestrictions.push("vegetariano");

  // Alimentos por refeição ("Café: aveia, whey e pasta de amendoim") — usa o
  // texto original para preservar os nomes como o treinador escreveu.
  d.mealFoods = parseMealFoods(text);

  d.recognized = describeDirective(d);
  return d;
}

/**
 * Diretiva efetiva de uma preferência persistida: usa a interpretação gravada
 * (pode ter sido enriquecida pela IA); na ausência, o parser determinístico
 * sobre o texto cru — mesma regra em todos os consumidores (hook e Relatório).
 */
export function resolveStoredDirective(
  pref: Pick<MealPlanPref, "instruction" | "directive"> | null,
): MealPlanDirective {
  return pref?.directive ?? parseDirective(pref?.instruction ?? "");
}

/**
 * Funde a interpretação determinística com a da IA. O determinístico é
 * soberano nos números que capturou (calorias, refeições) — a IA nunca os
 * sobrescreve (evita alucinação numérica). Nos sinais booleanos, qualquer fonte
 * que ligue vale; restrições e "não suportados" são a união dos dois.
 */
export function mergeDirectives(
  base: MealPlanDirective,
  ai: MealPlanDirective,
): MealPlanDirective {
  const merged: MealPlanDirective = {
    caloriesOverride: base.caloriesOverride ?? ai.caloriesOverride,
    mealsPerDay: base.mealsPerDay ?? ai.mealsPerDay,
    budgetTight: base.budgetTight || ai.budgetTight,
    emphasizePracticality: base.emphasizePracticality || ai.emphasizePracticality,
    emphasizeSatiety: base.emphasizeSatiety || ai.emphasizeSatiety,
    noCarbAtNight: base.noCarbAtNight || ai.noCarbAtNight,
    addRestrictions: Array.from(new Set([...base.addRestrictions, ...ai.addRestrictions])),
    // Alimentos por refeição: o determinístico é soberano por slot; a IA
    // completa os slots que o texto estruturado não trouxe.
    mealFoods: { ...ai.mealFoods, ...base.mealFoods },
    recognized: [],
    unsupported: Array.from(new Set([...base.unsupported, ...ai.unsupported])),
  };
  merged.recognized = describeDirective(merged);
  return merged;
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
  if (Object.keys(d.mealFoods).length > 0) next.pinnedFoodNames = d.mealFoods;
  return next;
}
