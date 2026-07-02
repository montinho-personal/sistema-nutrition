import { describe, expect, it } from "vitest";

import { analyzeRecordatorio } from "@/modules/diagnosis/services/recordatorioAnalysis";
import type { AnswerMap } from "@/modules/diagnosis/types";

describe("analyzeRecordatorio — reconhecimento", () => {
  it("reconhece alimentos do banco no texto livre (com acento e sinônimo)", () => {
    const a: AnswerMap = { breakfast: "café com pão e ovo", lunch: "arroz, feijão e frango" };
    const r = analyzeRecordatorio(a);
    const cafe = r.meals.find((m) => m.key === "breakfast")!;
    expect(cafe.matchedFoods.join(" ").toLowerCase()).toMatch(/ovo/);
    expect(cafe.hasProtein).toBe(true);
    const almoco = r.meals.find((m) => m.key === "lunch")!;
    expect(almoco.matchedFoods.join(" ").toLowerCase()).toMatch(/frango|feij/);
    expect(almoco.hasProtein).toBe(true);
  });

  it("sem nenhum texto, não há dados", () => {
    expect(analyzeRecordatorio({}).hasData).toBe(false);
  });
});

describe("analyzeRecordatorio — observações determinísticas", () => {
  it("café da manhã sem proteína vira recomendação", () => {
    const r = analyzeRecordatorio({ breakfast: "pão com margarina e café preto" });
    expect(r.observations.some((o) => o.id === "breakfast_low_protein")).toBe(true);
  });

  it('detecta café pulado por texto ("pulo o café")', () => {
    const r = analyzeRecordatorio({ breakfast: "pulo o café, só tomo água" });
    expect(r.observations.some((o) => o.id === "breakfast_skipped")).toBe(true);
  });

  it("sinaliza calorias líquidas por bebida ou por texto", () => {
    const byBeverage = analyzeRecordatorio({ lunch: "arroz e frango", beverages: ["refrigerante"] });
    expect(byBeverage.observations.some((o) => o.id === "liquid_calories")).toBe(true);
    const byText = analyzeRecordatorio({ lunch: "prato feito com refrigerante" });
    expect(byText.observations.some((o) => o.id === "liquid_calories")).toBe(true);
  });

  it("hidratação baixa e poucos vegetais são apontados", () => {
    const r = analyzeRecordatorio({
      breakfast: "café com pão e ovo",
      lunch: "arroz e frango",
      water_intake: "menos_1l",
    });
    expect(r.observations.some((o) => o.id === "low_water")).toBe(true);
    expect(r.observations.some((o) => o.id === "low_vegetables")).toBe(true);
  });

  it("não aponta 'poucos vegetais' quando há salada", () => {
    const r = analyzeRecordatorio({ lunch: "arroz, frango e salada de alface e tomate" });
    expect(r.observations.some((o) => o.id === "low_vegetables")).toBe(false);
  });

  it('entende negação: "sem salada" não conta como vegetal', () => {
    const r = analyzeRecordatorio({ lunch: "arroz, feijão e bife, sem salada" });
    const almoco = r.meals.find((m) => m.key === "lunch")!;
    expect(almoco.hasVeg).toBe(false);
    expect(r.observations.some((o) => o.id === "low_vegetables")).toBe(true);
  });

  it("reforça positivamente quando as principais têm proteína", () => {
    const r = analyzeRecordatorio({
      breakfast: "ovo mexido e café",
      lunch: "arroz, feijão e frango",
      dinner: "tilápia com legumes",
    });
    expect(r.observations.some((o) => o.id === "good_protein_base")).toBe(true);
  });

  it("toda observação traz orientação (nunca só avisa)", () => {
    const r = analyzeRecordatorio({
      breakfast: "pão com refrigerante",
      water_intake: "menos_1l",
    });
    for (const o of r.observations) expect(o.detail.length).toBeGreaterThan(0);
  });
});
