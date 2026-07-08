/**
 * Edições manuais do cardápio (Documento 00 — o treinador tem a palavra final).
 *
 * O cardápio é derivado da estratégia; as edições (trocar, quantidade, remover,
 * adicionar) são persistidas por aluno e reaplicadas AQUI, de forma pura — o
 * MESMO plano editado alimenta o quadro do cardápio, o Parecer, o Documento
 * Premium e o Relatório (Documento 17 — fonte única, nunca duplicar).
 *
 * Transições de estado também vivem aqui (Documento 11 — regra de negócio em
 * `services/`, nunca em componentes): cada handler da UI vira uma função pura
 * `(edits) => edits`, sempre devolvendo um objeto novo (nunca muta).
 */

import type { Food } from "@/modules/foods/types";
import {
  buildItemWithGrams,
  buildSwapItem,
  classifyRole,
  sumItems,
} from "@/modules/meal-plan/services/mealPlanEngine";
import type {
  EditedMeal,
  EditedMealPlan,
  ExtraFood,
  FoodRole,
  MealEntry,
  MealPlan,
  MealPlanEdits,
  MealSlot,
} from "@/modules/meal-plan/types";

/** Gramas de um alimento adicionado quando ele não tem porção sugerida. */
const DEFAULT_EXTRA_GRAMS = 100;

/** Prefixo das chaves de itens adicionados (`x:${slot}:${id}`). */
const EXTRA_KEY_PREFIX = "x:";

/** Sem nenhuma edição. */
export function emptyEdits(): MealPlanEdits {
  return { overrides: {}, removed: [], extras: {}, meals: {} };
}

/** true se o treinador editou algo (aciona o aviso "salvo automaticamente"). */
export function hasPlanEdits(edits: MealPlanEdits | null | undefined): boolean {
  if (!edits) return false;
  return (
    Object.keys(edits.overrides).length > 0 ||
    edits.removed.length > 0 ||
    Object.values(edits.extras).some((list) => (list ?? []).length > 0) ||
    Object.values(edits.meals ?? {}).some((m) => m && (m.title !== null || m.time !== null))
  );
}

/** Chave estável de um item-base do cardápio. */
export function baseItemKey(slot: MealSlot, role: FoodRole): string {
  return `${slot}:${role}`;
}

function isExtraKey(key: string): boolean {
  return key.startsWith(EXTRA_KEY_PREFIX);
}

function parseExtraKey(key: string): { slot: MealSlot; id: string } {
  const [, slot, id] = key.split(":");
  return { slot: slot as MealSlot, id };
}

function updateExtras(
  edits: MealPlanEdits,
  slot: MealSlot,
  update: (list: ExtraFood[]) => ExtraFood[],
): MealPlanEdits {
  return { ...edits, extras: { ...edits.extras, [slot]: update(edits.extras[slot] ?? []) } };
}

/** Troca o alimento de um item — porção automática (preserva a contribuição do papel). */
export function swapFood(edits: MealPlanEdits, key: string, food: Food): MealPlanEdits {
  if (isExtraKey(key)) {
    const { slot, id } = parseExtraKey(key);
    return updateExtras(edits, slot, (list) =>
      list.map((a) =>
        a.id === id
          ? { ...a, foodId: food.id, grams: food.portions[0]?.grams ?? a.grams }
          : a,
      ),
    );
  }
  return { ...edits, overrides: { ...edits.overrides, [key]: { foodId: food.id, grams: null } } };
}

/** Fixa a quantidade em gramas — mantém o alimento atual do item. */
export function setFoodGrams(edits: MealPlanEdits, key: string, grams: number): MealPlanEdits {
  if (isExtraKey(key)) {
    const { slot, id } = parseExtraKey(key);
    return updateExtras(edits, slot, (list) =>
      list.map((a) => (a.id === id ? { ...a, grams } : a)),
    );
  }
  const current = edits.overrides[key] ?? { foodId: null, grams: null };
  return { ...edits, overrides: { ...edits.overrides, [key]: { ...current, grams } } };
}

/** Desfaz troca/quantidade de um item-base ("Voltar ao original"). */
export function resetOverride(edits: MealPlanEdits, key: string): MealPlanEdits {
  if (!(key in edits.overrides)) return edits;
  const overrides = { ...edits.overrides };
  delete overrides[key];
  return { ...edits, overrides };
}

/** Remove um item do cardápio (base marca como removido; adicionado some). */
export function removeFood(edits: MealPlanEdits, key: string): MealPlanEdits {
  if (isExtraKey(key)) {
    const { slot, id } = parseExtraKey(key);
    return updateExtras(edits, slot, (list) => list.filter((a) => a.id !== id));
  }
  const next = resetOverride(edits, key);
  if (next.removed.includes(key)) return next;
  return { ...next, removed: [...next.removed, key] };
}

/** Restaura um item-base removido. */
export function restoreFood(edits: MealPlanEdits, key: string): MealPlanEdits {
  return { ...edits, removed: edits.removed.filter((k) => k !== key) };
}

/**
 * Edita nome e/ou horário de uma refeição. Nome vazio ou horário vazio voltam
 * a null (usa o padrão / sem horário); sem nada editado, a entrada some.
 */
export function setMealDetails(
  edits: MealPlanEdits,
  slot: MealSlot,
  patch: { title?: string | null; time?: string | null },
): MealPlanEdits {
  const meals = { ...(edits.meals ?? {}) };
  const current = meals[slot] ?? { title: null, time: null };
  const normalize = (v: string | null | undefined, fallback: string | null) => {
    if (v === undefined) return fallback;
    const trimmed = v?.trim() ?? "";
    return trimmed ? trimmed : null;
  };
  const next = {
    title: normalize(patch.title, current.title),
    time: normalize(patch.time, current.time),
  };
  if (next.title === null && next.time === null) delete meals[slot];
  else meals[slot] = next;
  return { ...edits, meals };
}

/** Adiciona um alimento a uma refeição, com a porção sugerida e id sequencial. */
export function addFood(edits: MealPlanEdits, slot: MealSlot, food: Food): MealPlanEdits {
  const maxId = Object.values(edits.extras)
    .flatMap((list) => list ?? [])
    .reduce((max, a) => Math.max(max, Number(a.id) || 0), 0);
  const extra: ExtraFood = {
    id: String(maxId + 1),
    foodId: food.id,
    grams: food.portions[0]?.grams ?? DEFAULT_EXTRA_GRAMS,
  };
  return updateExtras(edits, slot, (list) => [...list, extra]);
}

const pct = (value: number, target: number) =>
  target > 0 ? Math.round((value / target) * 100) : 0;

/**
 * Aplica as edições a um plano gerado e recalcula totais e aderência ao alvo.
 * Com `edits` vazio/nulo devolve o plano intacto (já com as `entries` que a UI
 * usa como chave estável). Chaves órfãs (a refeição/papel não existe mais) são
 * ignoradas em silêncio — o plano nunca quebra.
 */
export function applyPlanEdits(
  plan: MealPlan,
  edits: MealPlanEdits | null | undefined,
  foods: Food[],
): EditedMealPlan {
  const e = edits ?? emptyEdits();
  const foodById = new Map(foods.map((f) => [f.id, f]));
  const removed = new Set(e.removed);

  const meals: EditedMeal[] = plan.meals.map((meal) => {
    const baseEntries: MealEntry[] = meal.items
      .filter((it) => !removed.has(baseItemKey(meal.slot, it.role)))
      .map((it) => {
        const key = baseItemKey(meal.slot, it.role);
        const ov = e.overrides[key];
        let display = it;
        if (ov) {
          const food = foodById.get(ov.foodId ?? it.foodId);
          if (food) {
            display =
              ov.grams != null
                ? buildItemWithGrams(food, it.role, ov.grams)
                : buildSwapItem(food, it.role, it);
          }
        }
        return { key, item: display, base: true };
      });

    const addedEntries: MealEntry[] = (e.extras[meal.slot] ?? []).flatMap((a) => {
      const food = foodById.get(a.foodId);
      if (!food) return [];
      return [
        {
          key: `${EXTRA_KEY_PREFIX}${meal.slot}:${a.id}`,
          item: buildItemWithGrams(food, classifyRole(food), a.grams),
          base: false,
        },
      ];
    });

    const entries = [...baseEntries, ...addedEntries];
    const items = entries.map((entry) => entry.item);
    const removedBase = meal.items
      .filter((it) => removed.has(baseItemKey(meal.slot, it.role)))
      .map((it) => ({ key: baseItemKey(meal.slot, it.role), foodName: it.foodName }));
    // Nome e horário editados pelo treinador (nome vazio mantém o padrão).
    const details = e.meals?.[meal.slot];
    return {
      ...meal,
      title: details?.title ?? meal.title,
      time: details?.time ?? null,
      items,
      totals: sumItems(items),
      entries,
      removedBase,
    };
  });

  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.totals.kcal,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fat: acc.fat + m.totals.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const t = plan.target;
  return {
    ...plan,
    meals,
    totals,
    accuracy: {
      kcal: pct(totals.kcal, t.kcal),
      protein: pct(totals.protein, t.protein),
      carbs: pct(totals.carbs, t.carbs),
      fat: pct(totals.fat, t.fat),
    },
  };
}
