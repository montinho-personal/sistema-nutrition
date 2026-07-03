import { describe, expect, it } from "vitest";

import { evaluateStrategyAlerts } from "@/modules/strategy/services";

const base = {
  calories: 2200,
  proteinG: 165, // ~2 g/kg em 82 kg
  fatG: 66, // ~0.8 g/kg
  tdee: 2700,
  weightKg: 82,
  direction: "deficit" as const,
  trainsRegularly: true,
};

describe("alertas inteligentes da estratégia", () => {
  it("estratégia equilibrada → verde único", () => {
    const a = evaluateStrategyAlerts(base);
    expect(a).toHaveLength(1);
    expect(a[0].level).toBe("green");
  });

  it("proteína muito baixa → vermelho (risco de perda muscular)", () => {
    const a = evaluateStrategyAlerts({ ...base, proteinG: 90 }); // ~1.1 g/kg
    expect(a[0].level).toBe("red");
    expect(a.some((x) => x.title.includes("perda muscular"))).toBe(true);
  });

  it("proteína entre 1.2 e 1.6 g/kg → laranja", () => {
    const a = evaluateStrategyAlerts({ ...base, proteinG: 115 }); // ~1.4 g/kg
    expect(a.some((x) => x.level === "orange" && x.title.includes("Proteína"))).toBe(true);
    expect(a.every((x) => x.level !== "green")).toBe(true);
  });

  it("déficit acima de 35% do TDEE → vermelho", () => {
    const a = evaluateStrategyAlerts({ ...base, calories: 1600 }); // ~41% de déficit
    expect(a.some((x) => x.level === "red" && x.title.includes("Déficit"))).toBe(true);
  });

  it("gordura abaixo do piso → laranja", () => {
    const a = evaluateStrategyAlerts({ ...base, fatG: 40 }); // ~0.49 g/kg
    expect(a.some((x) => x.title.includes("Gordura"))).toBe(true);
  });

  it("ordena do mais grave ao mais leve", () => {
    const a = evaluateStrategyAlerts({ ...base, proteinG: 90, calories: 2100, fatG: 40 });
    const rank = { red: 3, orange: 2, yellow: 1, green: 0 } as const;
    for (let i = 1; i < a.length; i++) {
      expect(rank[a[i - 1].level]).toBeGreaterThanOrEqual(rank[a[i].level]);
    }
  });
});
