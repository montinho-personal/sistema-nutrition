import { describe, expect, it } from "vitest";

import { computeScoreMap } from "@/modules/diagnosis/services";
import type { AnswerMap, ScoreKey } from "@/modules/diagnosis/types";
import { buildStrategy } from "@/modules/strategy/services";
import { GOAL_DIRECTION } from "@/modules/strategy/constants/parameters";

type Scores = Record<ScoreKey, number>;

/** Scores neutros (linha de base) para isolar cada regra. */
function baseline(overrides: Partial<Scores> = {}): Scores {
  const s = computeScoreMap({});
  return { ...s, ...overrides };
}

describe("buildStrategy — direção do objetivo", () => {
  it("emagrecimento gera déficit; hipertrofia gera superávit", () => {
    const cut = buildStrategy("weight_loss", baseline(), {});
    const bulk = buildStrategy("hypertrophy", baseline(), {});
    expect(cut.direction).toBe("deficit");
    expect(bulk.direction).toBe("superavit");
    expect(GOAL_DIRECTION.maintenance).toBe("manutencao");
  });

  it("sempre entrega as 12 decisões, cada uma com justificativa", () => {
    const strategy = buildStrategy("weight_loss", baseline(), {});
    expect(strategy.decisions).toHaveLength(12);
    for (const d of strategy.decisions) {
      expect(d.reason.length).toBeGreaterThan(0);
      expect(d.step).toBeGreaterThanOrEqual(1);
      expect(d.step).toBeLessThanOrEqual(12);
    }
  });
});

describe("buildStrategy — velocidade", () => {
  it("alto risco de abandono força velocidade conservadora", () => {
    const s = baseline({ abandonmentRisk: 80, adherence: 40, consistency: 40 });
    const strategy = buildStrategy("weight_loss", s, {});
    expect(["muito_conservadora", "conservadora"]).toContain(strategy.velocity);
  });

  it("baixa flexibilidade (tudo-ou-nada) protege a aderência", () => {
    const s = baseline({ flexibility: 20 });
    const strategy = buildStrategy("weight_loss", s, {});
    expect(["muito_conservadora", "conservadora"]).toContain(strategy.velocity);
    // e a flexibilidade prescrita vira "planejada"
    expect(strategy.flexibility).toBe("planejada");
  });

  it("alta capacidade + urgência permite acelerar", () => {
    const s = baseline({ adherence: 85, consistency: 85, abandonmentRisk: 20, flexibility: 70 });
    const strategy = buildStrategy("weight_loss", s, { timeline: "urgente" });
    expect(["intensiva", "agressiva"]).toContain(strategy.velocity);
  });
});

describe("buildStrategy — filosofia e refeições", () => {
  it("baixa organização/praticidade → plano tradicional (menor carga)", () => {
    const s = baseline({ organization: 30, practicality: 30 });
    const strategy = buildStrategy("weight_loss", s, {});
    expect(strategy.philosophy).toBe("plano_tradicional");
  });

  it("boa organização e flexibilidade → contagem de macros", () => {
    const s = baseline({ organization: 80, flexibility: 80 });
    const strategy = buildStrategy("weight_loss", s, {});
    expect(strategy.philosophy).toBe("contagem_macros");
  });

  it("fome mal controlada aumenta o nº de refeições", () => {
    const low = buildStrategy("weight_loss", baseline({ hungerControl: 20 }), {});
    const normal = buildStrategy("weight_loss", baseline(), {});
    expect(low.mealsPerDay).toBeGreaterThan(normal.mealsPerDay);
  });

  it("rotina sem praticidade reduz o nº de refeições", () => {
    const answers: AnswerMap = { cook_availability: "quase_nunca" };
    const strategy = buildStrategy("weight_loss", baseline({ practicality: 30 }), answers);
    expect(strategy.mealsPerDay).toBeLessThanOrEqual(3);
  });
});

describe("buildStrategy — suplementação", () => {
  it("aluno que evita suplementos não recebe prescrição de suplemento", () => {
    const strategy = buildStrategy("weight_loss", baseline(), { supplement_openness: "nao" });
    const supp = strategy.decisions.find((d) => d.id === "supplements");
    expect(supp?.decision).toMatch(/sem suplementos/i);
  });
});
