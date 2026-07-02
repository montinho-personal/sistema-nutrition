import { describe, expect, it } from "vitest";

import { recommendSupplements } from "@/modules/supplements/services";
import type { SupplementContext } from "@/modules/supplements/types";

function ctx(overrides: Partial<SupplementContext> = {}): SupplementContext {
  return {
    trains: "nao",
    hungerControl: 60,
    practicality: 60,
    restrictions: [],
    healthConditions: [],
    sleepHours: 7,
    mealsOut: "semanal",
    budgetTight: false,
    openness: "sim",
    ...overrides,
  };
}

function byId(recs: ReturnType<typeof recommendSupplements>, id: string) {
  const r = recs.find((x) => x.supplement.id === id);
  if (!r) throw new Error(`recomendação ausente: ${id}`);
  return r;
}

describe("recommendSupplements — dificuldade primeiro", () => {
  it("perfil sem dificuldades: nada recomendado", () => {
    const recs = recommendSupplements(ctx());
    expect(recs.every((r) => r.status === "not_needed")).toBe(true);
  });

  it("quem treina recebe creatina como recomendada", () => {
    const recs = recommendSupplements(ctx({ trains: "regular" }));
    expect(byId(recs, "creatine").status).toBe("recommended");
  });

  it("praticidade baixa recomenda whey (fechar a proteína)", () => {
    const recs = recommendSupplements(ctx({ practicality: 30 }));
    expect(byId(recs, "whey").status).toBe("recommended");
  });

  it("fome mal controlada recomenda fibra", () => {
    const recs = recommendSupplements(ctx({ hungerControl: 30 }));
    expect(byId(recs, "fiber").status).toBe("recommended");
  });

  it("dieta vegana recomenda B12", () => {
    const recs = recommendSupplements(ctx({ restrictions: ["vegano"] }));
    expect(byId(recs, "b12").status).toBe("recommended");
  });

  it("sono curto sugere magnésio", () => {
    const recs = recommendSupplements(ctx({ sleepHours: 5 }));
    expect(byId(recs, "magnesium").status).toBe("recommended");
  });
});

describe("recommendSupplements — abertura e orçamento", () => {
  it("quem prefere evitar não recebe indicação (respeita a preferência)", () => {
    const recs = recommendSupplements(ctx({ trains: "regular", openness: "nao" }));
    expect(byId(recs, "creatine").status).toBe("not_indicated");
  });

  it("orçamento apertado rebaixa o whey para 'avaliar'", () => {
    const recs = recommendSupplements(ctx({ practicality: 30, budgetTight: true }));
    expect(byId(recs, "whey").status).toBe("consider");
  });

  it("itens de alto valor seguem recomendados mesmo com cautela", () => {
    // creatina (evidência forte + custo-benefício alto) mantém-se recomendada
    const recs = recommendSupplements(ctx({ trains: "regular", budgetTight: true }));
    expect(byId(recs, "creatine").status).toBe("recommended");
  });
});

describe("recommendSupplements — ordenação", () => {
  it("recomendados aparecem antes dos não necessários", () => {
    const recs = recommendSupplements(ctx({ trains: "regular" }));
    const firstNotNeeded = recs.findIndex((r) => r.status === "not_needed");
    const lastRecommended = recs.map((r) => r.status).lastIndexOf("recommended");
    expect(lastRecommended).toBeLessThan(firstNotNeeded);
  });
});
