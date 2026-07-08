import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  addFood,
  applyPlanEdits,
  baseItemKey,
  buildMealPlan,
  classifyRole,
  emptyEdits,
  hasPlanEdits,
  removeFood,
  resetOverride,
  resolveFoodName,
  restoreFood,
  setFoodGrams,
  setMealDetails,
  swapFood,
  type MealPlanContext,
} from "@/modules/meal-plan/services";

const CTX: MealPlanContext = {
  goal: "weight_loss",
  mealsPerDay: 4,
  macros: { kcal: 2000, protein: 160, carbs: 200, fat: 60 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
};

const plan = buildMealPlan(curatedFoods, CTX);
const meal = plan.meals[0];
const item = meal.items[0];
const key = baseItemKey(meal.slot, item.role);

describe("applyPlanEdits — o cardápio editado é recalculado por inteiro", () => {
  it("sem edições, devolve o plano intacto (com entries de chave estável)", () => {
    const out = applyPlanEdits(plan, null, curatedFoods);
    expect(out.totals).toEqual(plan.totals);
    expect(out.accuracy).toEqual(plan.accuracy);
    const first = out.meals[0];
    expect(first.entries.length).toBe(plan.meals[0].items.length);
    expect(first.entries[0].key).toBe(key);
    expect(first.removedBase).toHaveLength(0);
  });

  it("quantidade manual mantém o alimento e fixa as gramas exatas", () => {
    const edits = setFoodGrams(emptyEdits(), key, 123);
    const out = applyPlanEdits(plan, edits, curatedFoods);
    const edited = out.meals[0].entries.find((e) => e.key === key)!.item;
    expect(edited.foodId).toBe(item.foodId);
    expect(edited.grams).toBe(123);
    // Totais do dia refletem a mudança (recalculados, nunca os originais).
    expect(out.meals[0].totals.kcal).not.toBe(0);
  });

  it("troca substitui o alimento preservando a contribuição do papel", () => {
    const replacement = curatedFoods.find(
      (f) => f.id !== item.foodId && classifyRole(f) === item.role,
    )!;
    const edits = swapFood(emptyEdits(), key, replacement);
    const out = applyPlanEdits(plan, edits, curatedFoods);
    const edited = out.meals[0].entries.find((e) => e.key === key)!.item;
    expect(edited.foodId).toBe(replacement.id);
    expect(edited.grams).toBeGreaterThan(0);
  });

  it("remover tira o item (e dos totais); restaurar traz de volta", () => {
    const removed = removeFood(emptyEdits(), key);
    const out = applyPlanEdits(plan, removed, curatedFoods);
    expect(out.meals[0].entries.some((e) => e.key === key)).toBe(false);
    expect(out.meals[0].removedBase.map((r) => r.key)).toContain(key);
    expect(out.totals.kcal).toBeLessThan(plan.totals.kcal);

    const restored = restoreFood(removed, key);
    const back = applyPlanEdits(plan, restored, curatedFoods);
    expect(back.meals[0].entries.some((e) => e.key === key)).toBe(true);
    expect(back.totals).toEqual(plan.totals);
  });

  it("adicionar cria o item com porção sugerida e id sequencial estável", () => {
    const banana = resolveFoodName(curatedFoods, "banana")!;
    const ovo = resolveFoodName(curatedFoods, "ovo")!;
    let edits = addFood(emptyEdits(), meal.slot, banana);
    edits = addFood(edits, meal.slot, ovo);
    expect(edits.extras[meal.slot]!.map((a) => a.id)).toEqual(["1", "2"]);

    const out = applyPlanEdits(plan, edits, curatedFoods);
    const added = out.meals[0].entries.filter((e) => !e.base);
    expect(added.map((e) => e.key)).toEqual([
      `x:${meal.slot}:1`,
      `x:${meal.slot}:2`,
    ]);
    expect(out.totals.kcal).toBeGreaterThan(plan.totals.kcal);

    // Remover um adicionado o apaga de vez (não vai para "removidos").
    const without = removeFood(edits, `x:${meal.slot}:1`);
    const cleaned = applyPlanEdits(plan, without, curatedFoods);
    expect(cleaned.meals[0].entries.filter((e) => !e.base)).toHaveLength(1);
    expect(cleaned.meals[0].removedBase).toHaveLength(0);
  });

  it("nome e horário editados aparecem na refeição (vazio volta ao padrão)", () => {
    let edits = setMealDetails(emptyEdits(), meal.slot, { title: "Pré-treino", time: "07:30" });
    let out = applyPlanEdits(plan, edits, curatedFoods);
    expect(out.meals[0].title).toBe("Pré-treino");
    expect(out.meals[0].time).toBe("07:30");
    // As demais refeições seguem intactas, sem horário.
    expect(out.meals[1].title).toBe(plan.meals[1].title);
    expect(out.meals[1].time).toBeNull();

    // Limpar o nome volta ao título padrão; limpar o horário o remove.
    edits = setMealDetails(edits, meal.slot, { title: "  " });
    out = applyPlanEdits(plan, edits, curatedFoods);
    expect(out.meals[0].title).toBe(plan.meals[0].title);
    expect(out.meals[0].time).toBe("07:30");
    edits = setMealDetails(edits, meal.slot, { time: "" });
    expect(hasPlanEdits(edits)).toBe(false);
  });

  it("edições persistidas antes do campo `meals` continuam funcionando", () => {
    // Simula um registro antigo no localStorage (sem a chave `meals`).
    const legacy = { overrides: {}, removed: [key], extras: {} } as ReturnType<typeof emptyEdits>;
    const out = applyPlanEdits(plan, legacy, curatedFoods);
    expect(out.meals[0].entries.some((e) => e.key === key)).toBe(false);
    expect(hasPlanEdits(legacy)).toBe(true);
    // E dá para editar o nome a partir dele.
    const renamed = setMealDetails(legacy, meal.slot, { title: "Café reforçado" });
    expect(applyPlanEdits(plan, renamed, curatedFoods).meals[0].title).toBe("Café reforçado");
  });

  it("chaves órfãs (de um cardápio antigo) são ignoradas sem quebrar", () => {
    const edits = removeFood(setFoodGrams(emptyEdits(), "supper:protein", 99), "supper:carb");
    const out = applyPlanEdits(plan, edits, curatedFoods);
    expect(out.totals).toEqual(plan.totals);
  });
});

describe("transições de edição — puras e detectáveis", () => {
  it("nunca mutam o objeto anterior", () => {
    const before = emptyEdits();
    setFoodGrams(before, key, 50);
    removeFood(before, key);
    addFood(before, meal.slot, curatedFoods[0]);
    expect(before).toEqual(emptyEdits());
  });

  it("hasPlanEdits distingue cardápio limpo de editado", () => {
    expect(hasPlanEdits(null)).toBe(false);
    expect(hasPlanEdits(emptyEdits())).toBe(false);
    expect(hasPlanEdits(setFoodGrams(emptyEdits(), key, 80))).toBe(true);
    expect(hasPlanEdits(removeFood(emptyEdits(), key))).toBe(true);
    expect(hasPlanEdits(addFood(emptyEdits(), meal.slot, curatedFoods[0]))).toBe(true);
    // Desfazer a única edição volta a "sem edições".
    expect(hasPlanEdits(resetOverride(setFoodGrams(emptyEdits(), key, 80), key))).toBe(false);
  });
});
