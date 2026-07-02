import { describe, expect, it } from "vitest";

import {
  buildEvolutionInsights,
  computeEvolution,
  expectedWeeklyKgFromMacros,
} from "@/modules/follow-ups/services";
import type { FollowUp, FollowUpScales } from "@/modules/follow-ups/types";

const SCALES: FollowUpScales = { adherence: 7, hunger: 5, sleep: 6, energy: 6, mood: 6 };

function fu(date: string, weightKg: number, scales: Partial<FollowUpScales> = {}): FollowUp {
  return {
    id: date,
    studentId: "s1",
    date,
    weightKg,
    scales: { ...SCALES, ...scales },
    whatWorked: null,
    whatFailed: null,
    why: null,
    createdAt: `${date}T00:00:00.000Z`,
  };
}

describe("expectedWeeklyKgFromMacros", () => {
  it("déficit gera perda semanal negativa proporcional", () => {
    // déficit de 500 kcal/dia → 500*7/7700 ≈ 0,4545 kg/sem
    const rate = expectedWeeklyKgFromMacros("deficit", 2500, 2000);
    expect(rate).toBeCloseTo(-0.4545, 2);
  });

  it("superávit gera ganho amortecido pelo fator", () => {
    const rate = expectedWeeklyKgFromMacros("superavit", 2000, 2300);
    expect(rate).toBeGreaterThan(0);
    // 300*7/7700*0.5 ≈ 0,136
    expect(rate).toBeCloseTo(0.136, 2);
  });

  it("manutenção espera ritmo zero", () => {
    expect(expectedWeeklyKgFromMacros("manutencao", 2000, 2000)).toBe(0);
  });
});

describe("computeEvolution — status", () => {
  const expected = expectedWeeklyKgFromMacros("deficit", 2500, 2000); // ≈ -0,45/sem

  it("sem acompanhamentos, dados insuficientes", () => {
    const e = computeEvolution(90, "2026-01-01", [], expected);
    expect(e.status).toBe("insufficient");
    expect(e.actualWeeklyKg).toBeNull();
    expect(e.currentWeight).toBe(90);
  });

  it("perda no ritmo previsto → no ritmo", () => {
    // ~0,45 kg/sem por 4 semanas ≈ -1,8 kg
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 88.2)], expected);
    expect(e.status).toBe("on_track");
    expect(e.totalChangeKg).toBeCloseTo(-1.8, 1);
  });

  it("quase nenhuma mudança → estagnado", () => {
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 89.9)], expected);
    expect(e.status).toBe("stalled");
  });

  it("ganhar peso quando deveria perder → tendência contrária", () => {
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 91)], expected);
    expect(e.status).toBe("reversing");
  });

  it("perda muito além do previsto → acelerado", () => {
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 85)], expected);
    expect(e.status).toBe("fast");
  });

  it("calcula o ritmo real e a variação do último período", () => {
    const e = computeEvolution(
      90,
      "2026-01-01",
      [fu("2026-01-15", 89), fu("2026-01-29", 88)],
      expected,
    );
    expect(e.previousWeight).toBe(89);
    expect(e.lastChangeKg).toBeCloseTo(-1, 1);
    expect(e.actualWeeklyKg).not.toBeNull();
  });
});

describe("buildEvolutionInsights", () => {
  const expected = expectedWeeklyKgFromMacros("deficit", 2500, 2000);

  it("estagnação sugere revisão ligada ao plano de ajustes", () => {
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 89.9)], expected);
    const insights = buildEvolutionInsights(e);
    expect(insights.some((i) => i.id === "stalled" && i.kind === "risk")).toBe(true);
  });

  it("fome elevada gera recomendação de saciedade", () => {
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 88.2, { hunger: 9 })], expected);
    const insights = buildEvolutionInsights(e);
    expect(insights.some((i) => i.id === "high_hunger")).toBe(true);
  });

  it("adesão baixa gera alerta de risco", () => {
    const e = computeEvolution(90, "2026-01-01", [fu("2026-01-29", 88.2, { adherence: 3 })], expected);
    const insights = buildEvolutionInsights(e);
    expect(insights.some((i) => i.id === "low_adherence" && i.kind === "risk")).toBe(true);
  });
});
