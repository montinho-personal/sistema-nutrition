import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  buildFoodAlerts,
  classifyFood,
  energyDensityLevel,
  filterFoods,
  matchesQuery,
  proteinPer100Kcal,
  recommendFoods,
  scoreToLevel,
} from "@/modules/foods/services";
import { importRawFoods } from "@/modules/foods/services/tbcaImport";
import type { Food } from "@/modules/foods/types";

function food(id: string): Food {
  const f = curatedFoods.find((x) => x.id === id);
  if (!f) throw new Error(`fixture ${id} não encontrada`);
  return f;
}

describe("curatedFoods — completude dos dados", () => {
  it("todo alimento tem ao menos uma medida caseira (Relatório sempre mostra ≈X unidade)", () => {
    const missing = curatedFoods.filter((f) => !f.portions || f.portions.length === 0);
    expect(missing.map((f) => f.name)).toEqual([]);
  });

  it("toda medida caseira tem gramas positivas e nome não vazio", () => {
    for (const f of curatedFoods) {
      for (const portion of f.portions) {
        expect(portion.grams).toBeGreaterThan(0);
        expect(portion.name.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("foodMetrics", () => {
  it("mapeia score para nível qualitativo", () => {
    expect(scoreToLevel(85)).toBe("very_high");
    expect(scoreToLevel(65)).toBe("high");
    expect(scoreToLevel(45)).toBe("moderate");
    expect(scoreToLevel(25)).toBe("low");
    expect(scoreToLevel(5)).toBe("very_low");
    expect(scoreToLevel(null)).toBeNull();
  });

  it("calcula proteína por 100 kcal", () => {
    // Frango: 32 g / 159 kcal * 100 ≈ 20.1
    expect(proteinPer100Kcal(food("FIE001"))).toBeCloseTo(20.13, 1);
    // Azeite: 0 proteína
    expect(proteinPer100Kcal(food("FIE019"))).toBe(0);
  });

  it("classifica densidade energética", () => {
    expect(energyDensityLevel(food("FIE023"))).toBe("very_low"); // brócolis 25 kcal
    expect(energyDensityLevel(food("FIE019"))).toBe("very_high"); // azeite 884 kcal
  });
});

describe("classifyFood", () => {
  it("classifica frango grelhado como excelente", () => {
    const r = classifyFood(food("FIE001"));
    expect(r.classification).toBe("excellent");
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.computed).toBe(true);
  });

  it("classifica azeite (denso) como context_dependent", () => {
    expect(classifyFood(food("FIE019")).classification).toBe("context_dependent");
  });

  it("classifica pão francês (ultraprocessado? não) e alta palatabilidade como neutro", () => {
    // pão francês é 'processed', satiety 40, overeating high -> não excelente/bom
    expect(classifyFood(food("FIE012")).classification).toBe("neutral");
  });

  it("respeita override manual", () => {
    const custom = {
      ...food("FIE009"),
      attributes: { ...food("FIE009").attributes, strategicOverride: "excellent" as const },
    };
    const r = classifyFood(custom);
    expect(r.classification).toBe("excellent");
    expect(r.computed).toBe(false);
  });

  it("marca ultraprocessado como poor sem demonizar", () => {
    const up = { ...food("FIE012"), processingLevel: "ultra_processed" as const };
    const r = classifyFood(up);
    expect(r.classification).toBe("poor");
    expect(r.reasons.join(" ")).toMatch(/ocasional/i);
  });
});

describe("buildFoodAlerts", () => {
  it("alerta sódio elevado no atum enlatado", () => {
    const alerts = buildFoodAlerts(food("FIE005")); // 320 mg -> abaixo de 400, sem alerta
    expect(alerts.find((a) => a.kind === "high_sodium")).toBeUndefined();
    const bread = buildFoodAlerts(food("FIE012")); // 648 mg
    expect(bread.find((a) => a.kind === "high_sodium")).toBeDefined();
  });

  it("todo alerta traz orientação (nunca apenas avisa)", () => {
    for (const f of curatedFoods) {
      for (const alert of buildFoodAlerts(f)) {
        expect(alert.guidance.length).toBeGreaterThan(0);
      }
    }
  });

  it("não alerta baixa proteína em fontes de gordura ou hortaliças", () => {
    expect(buildFoodAlerts(food("FIE019")).find((a) => a.kind === "low_protein")).toBeUndefined();
    expect(buildFoodAlerts(food("FIE023")).find((a) => a.kind === "low_protein")).toBeUndefined();
  });
});

describe("busca e filtros", () => {
  it("busca por sinônimo com tolerância a acentos", () => {
    expect(matchesQuery(food("FIE016"), "aipim")).toBe(true); // mandioca
    expect(matchesQuery(food("FIE001"), "FRANGO")).toBe(true);
    expect(matchesQuery(food("FIE001"), "peixe")).toBe(false);
  });

  it("filtro composto: proteico + barato + preparo rápido", () => {
    const result = filterFoods(curatedFoods, {
      minProteinG: 10,
      maxCost: "low",
      maxPrepMinutes: 10,
    });
    const names = result.map((f) => f.name);
    expect(names).toContain("Ovo de galinha, inteiro, cozido");
    expect(names).toContain("Aveia, flocos");
    // frango custa 'medium' -> fora
    expect(names).not.toContain("Frango, peito, grelhado");
  });

  it("filtro por tag e por objetivo", () => {
    const highProtein = filterFoods(curatedFoods, { tags: ["Alta proteína"] });
    expect(highProtein.length).toBeGreaterThan(3);
    const loss = filterFoods(curatedFoods, { goal: "weight_loss" });
    expect(loss.every((f) => f.attributes.suitableGoals.includes("weight_loss"))).toBe(true);
  });

  it("recomenda para hipertrofia priorizando proteína", () => {
    const rec = recommendFoods(curatedFoods, "hypertrophy", {}, 5);
    expect(rec.length).toBeLessThanOrEqual(5);
    expect(rec.every((f) => f.attributes.suitableGoals.includes("hypertrophy"))).toBe(true);
  });
});

describe("importação TBCA", () => {
  it("mapeia registros válidos e reporta inválidos sem falhar", () => {
    const result = importRawFoods([
      {
        sourceName: "TBCA",
        sourceCode: "X001",
        name: "Quinoa cozida",
        energyKcal: 120,
        proteinG: 4.4,
        carbsG: 21.3,
        fatG: 1.9,
        fiberG: 2.8,
      },
      { sourceName: "TBCA", name: "sem código" }, // inválido
    ]);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.rows[0].name).toBe("Quinoa cozida");
    expect(result.errors[0].index).toBe(1);
  });
});

describe("integridade do banco de alimentos expandido", () => {
  it("tem cobertura ampliada (dezenas de alimentos)", () => {
    expect(curatedFoods.length).toBeGreaterThanOrEqual(70);
  });

  it("todos os códigos (ids) são únicos", () => {
    const ids = curatedFoods.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("macros e energia são numéricos e não-negativos", () => {
    for (const f of curatedFoods) {
      const n = f.nutrition;
      for (const value of [n.energyKcal, n.proteinG, n.carbsG, n.fatG, n.fiberG]) {
        expect(typeof value).toBe("number");
        expect(value as number).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("a energia informada bate com os macros (Atwater, tolerância de 15%)", () => {
    // A fibra conta no carboidrato mas rende menos energia; hortaliças de
    // baixa caloria (<40 kcal) têm ruído relativo alto e ficam de fora.
    for (const f of curatedFoods) {
      const { energyKcal, proteinG, carbsG, fatG } = f.nutrition;
      const fromMacros = (proteinG ?? 0) * 4 + (carbsG ?? 0) * 4 + (fatG ?? 0) * 9;
      if ((energyKcal ?? 0) < 40) continue;
      const diff = Math.abs((energyKcal ?? 0) - fromMacros) / (energyKcal ?? 1);
      expect(diff, `${f.name}: ${energyKcal} vs ${fromMacros}`).toBeLessThan(0.15);
    }
  });

  it("os alimentos animais usam os grupos que os filtros de restrição reconhecem", () => {
    const animalGroups = new Set(["Carnes", "Pescados", "Ovos", "Laticínios"]);
    // Carnes/pescados, ovo e laticínios/whey adicionados no bloco expandido.
    const animalCodes = [
      "FIE025", "FIE026", "FIE027", "FIE028", "FIE029", "FIE030", "FIE031", "FIE032",
      "FIE033", "FIE034", "FIE035", "FIE036", "FIE037", "FIE038", "FIE039", "FIE040",
    ];
    for (const code of animalCodes) {
      const f = curatedFoods.find((x) => x.id === code);
      expect(f, code).toBeDefined();
      expect(animalGroups.has(f!.foodGroup ?? ""), `${f!.name} → ${f!.foodGroup}`).toBe(true);
    }
  });
});
