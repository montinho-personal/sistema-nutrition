import { describe, expect, it } from "vitest";

import { projectGoal } from "@/modules/strategy/services/goalProjection";
import type { GoalProjectionInput } from "@/modules/strategy/types";

const base: GoalProjectionInput = {
  currentWeightKg: 80,
  targetChangeKg: 4,
  weeks: 8,
  direction: "deficit",
  velocity: "moderada",
  tdee: 2400,
  prescribedDeltaPct: 0.18,
  trainsRegularly: true,
  proteinAdequate: true,
  capacity: 120,
};

describe("projectGoal — matemática energética", () => {
  it("déficit diário = ritmo semanal × 7700 / 7", () => {
    // 4 kg / 8 sem = 0,5 kg/sem → 0,5 × 7700 / 7 = 550 kcal/dia
    const p = projectGoal(base);
    expect(p.weeklyRateKg).toBe(0.5);
    expect(p.dailyEnergyDeltaKcal).toBe(550);
    expect(Math.round(p.requiredDeltaPctTdee * 100)).toBe(23);
  });
});

describe("projectGoal — realismo do emagrecimento", () => {
  it("ritmo dentro do seguro é tranquilo e não gera sugestão", () => {
    const p = projectGoal(base); // 0,625%/sem ≤ 0,75%
    expect(p.realism.level).toBe("tranquilo");
    expect(p.suggestion).toBeNull();
  });

  it("ritmo entre seguro e máximo é ambicioso e sugere prazo realista", () => {
    const p = projectGoal({ ...base, targetChangeKg: 6, weeks: 8 }); // 0,75 kg/sem = 0,9375%
    expect(p.realism.level).toBe("ambicioso");
    expect(p.suggestion).not.toBeNull();
    expect(p.suggestion!.weeks).toBeGreaterThan(8);
  });

  it("ritmo acima do limite fisiológico é irrealista", () => {
    const p = projectGoal({ ...base, targetChangeKg: 10, weeks: 6 }); // ~2%/sem
    expect(p.realism.level).toBe("irrealista");
    expect(p.risks.length).toBeGreaterThan(0);
  });
});

describe("projectGoal — perda de massa magra", () => {
  it("treino de força + proteína adequada reduzem a fração de massa magra", () => {
    const protegido = projectGoal({ ...base, targetChangeKg: 6, weeks: 8 });
    const exposto = projectGoal({
      ...base,
      targetChangeKg: 6,
      weeks: 8,
      trainsRegularly: false,
      proteinAdequate: false,
    });
    expect(protegido.muscle).not.toBeNull();
    expect(exposto.muscle!.leanFractionPct).toBeGreaterThan(protegido.muscle!.leanFractionPct);
  });

  it("no superávit não há projeção de perda de massa magra", () => {
    const p = projectGoal({ ...base, direction: "superavit", targetChangeKg: 3, weeks: 10 });
    expect(p.muscle).toBeNull();
  });
});

describe("projectGoal — aderência", () => {
  it("pedir mais que a velocidade prescrita derruba a aderência", () => {
    const dentro = projectGoal({ ...base, prescribedDeltaPct: 0.3 });
    const alem = projectGoal({ ...base, prescribedDeltaPct: 0.05 });
    expect(alem.adherence.score).toBeLessThan(dentro.adherence.score);
  });

  it("baixa capacidade resulta em aderência menor", () => {
    const alta = projectGoal({ ...base, capacity: 140 });
    const baixa = projectGoal({ ...base, capacity: 50 });
    expect(baixa.adherence.score).toBeLessThan(alta.adherence.score);
  });
});

describe("projectGoal — ganho de peso", () => {
  it("ganhar rápido demais é ambicioso/irrealista (limite de construção muscular)", () => {
    const p = projectGoal({
      ...base,
      direction: "superavit",
      targetChangeKg: 4,
      weeks: 8, // 0,5 kg/sem = teto do ganho aceitável
    });
    expect(["ambicioso", "irrealista"]).toContain(p.realism.level);
  });
});
