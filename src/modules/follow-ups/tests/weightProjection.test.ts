import { describe, expect, it } from "vitest";

import { buildWeightProjection } from "@/modules/follow-ups/services";
import { WEIGHT_PROJECTION } from "@/modules/follow-ups/constants/parameters";
import type { FollowUp } from "@/modules/follow-ups/types";

const followUp = (date: string, weightKg: number): FollowUp => ({
  id: `fu-${date}`,
  studentId: "s1",
  date,
  weightKg,
  scales: { adherence: 7, hunger: 5, sleep: 7, energy: 7, mood: 7 },
  measurements: null,
  whatWorked: null,
  whatFailed: null,
  why: null,
  createdAt: `${date}T09:00:00.000Z`,
});

const BASE = {
  startWeightKg: 92,
  startDate: "2026-05-01",
  direction: "deficit" as const,
  tdee: 2700,
  calories: 2200,
  followUps: [] as FollowUp[],
};

describe("buildWeightProjection — a linha do plano", () => {
  it("com meta definida, o contrato é a meta: −6 kg em 12 semanas", () => {
    const p = buildWeightProjection({ ...BASE, targetChangeKg: 6, targetWeeks: 12 });
    expect(p.hasTarget).toBe(true);
    expect(p.weeks).toBe(12);
    expect(p.weeklyKg).toBeCloseTo(-0.5, 5);
    expect(p.endKg).toBeCloseTo(86, 5);
    expect(p.planned[0]).toEqual({ week: 0, kg: 92 });
    // Faixa na semana 12: ±20% dos 6 kg planejados.
    expect(p.upper.at(-1)!.kg).toBeCloseTo(87.2, 5);
    expect(p.lower.at(-1)!.kg).toBeCloseTo(84.8, 5);
  });

  it("sem meta, projeta pelo balanço energético no horizonte padrão", () => {
    const p = buildWeightProjection(BASE);
    expect(p.hasTarget).toBe(false);
    expect(p.weeks).toBe(WEIGHT_PROJECTION.defaultWeeks);
    // Déficit de 500 kcal/dia → −(500·7)/7700 kg por semana.
    expect(p.weeklyKg).toBeCloseTo(-(500 * 7) / 7700, 5);
    expect(p.endKg).toBeCloseTo(92 + p.weeklyKg * p.weeks, 5);
  });

  it("na manutenção, a faixa é fixa em kg (o ritmo é zero)", () => {
    const p = buildWeightProjection({ ...BASE, direction: "manutencao", calories: 2700 });
    expect(p.weeklyKg).toBe(0);
    expect(p.upper.at(-1)!.kg).toBe(92 + WEIGHT_PROJECTION.maintenanceBandKg);
    expect(p.lower.at(-1)!.kg).toBe(92 - WEIGHT_PROJECTION.maintenanceBandKg);
  });
});

describe("buildWeightProjection — o caminho real e o veredito", () => {
  const withTarget = { ...BASE, targetChangeKg: 6, targetWeeks: 12 };

  it("mapeia os registros em semanas fracionárias a partir do início", () => {
    const p = buildWeightProjection({
      ...withTarget,
      followUps: [followUp("2026-05-15", 91.1), followUp("2026-05-29", 90.2)],
    });
    // Sempre começa no peso inicial (semana 0).
    expect(p.actual[0]).toEqual({ week: 0, kg: 92 });
    expect(p.actual[1].week).toBeCloseTo(2, 1);
    expect(p.actual[2].week).toBeCloseTo(4, 1);
  });

  it("dentro da faixa → on_track", () => {
    // Semana 4: plano 90,0 ±0,4 kg.
    const p = buildWeightProjection({ ...withTarget, followUps: [followUp("2026-05-29", 90.2)] });
    expect(p.last?.pace).toBe("on_track");
  });

  it("progresso menor que o previsto → behind; maior → ahead", () => {
    const behind = buildWeightProjection({ ...withTarget, followUps: [followUp("2026-05-29", 91.4)] });
    expect(behind.last?.pace).toBe("behind");
    const ahead = buildWeightProjection({ ...withTarget, followUps: [followUp("2026-05-29", 89.0)] });
    expect(ahead.last?.pace).toBe("ahead");
  });

  it("cedo demais (mudança planejada < 0,5 kg) → sem veredito", () => {
    // Semana 0,4 (~3 dias): plano mudou ~0,2 kg — flutuação normal domina.
    const p = buildWeightProjection({ ...withTarget, followUps: [followUp("2026-05-04", 92.8)] });
    expect(p.last?.pace).toBeNull();
  });

  it("manutenção fora da faixa → drift", () => {
    const p = buildWeightProjection({
      ...BASE,
      direction: "manutencao",
      calories: 2700,
      followUps: [followUp("2026-05-29", 93.6)],
    });
    expect(p.last?.pace).toBe("drift");
  });

  it("sem acompanhamentos, não há veredito nem caminho real", () => {
    const p = buildWeightProjection(withTarget);
    expect(p.last).toBeNull();
    expect(p.actual).toHaveLength(1);
  });
});
