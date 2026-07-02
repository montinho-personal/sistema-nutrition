import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildStudentReport } from "@/modules/reports/services";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";

const student: Student = {
  id: "s1",
  fullName: "Renato Teste",
  sex: "male",
  birthDate: "1990-05-10",
  heightCm: 178,
  mainGoal: "weight_loss",
  email: null,
  phone: null,
  notes: null,
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
};

const session: DiagnosisSession = {
  id: "dx1",
  studentId: "s1",
  status: "completed",
  answers: {
    motivation_level: 8,
    discipline: 6,
    hunger_level: 7,
    all_or_nothing: 8,
    budget: "apertado",
    restrictions: ["nenhuma"],
    trains: "regular",
    activity: "moderado",
  },
  currentStageIndex: 9,
  startedAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:10:00.000Z",
  completedAt: "2026-05-01T12:10:00.000Z",
};

const record: StrategyRecord = {
  studentId: "s1",
  input: { currentWeightKg: 92, bodyFatPct: 24 },
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
};

const input = {
  student,
  session,
  record,
  followUps: [] as FollowUp[],
  foods: curatedFoods,
  generatedAt: "2026-06-01",
};

describe("buildStudentReport", () => {
  it("retorna null sem estratégia (cadeia incompleta)", () => {
    expect(buildStudentReport({ ...input, record: null })).toBeNull();
  });

  it("retorna null com diagnóstico não concluído", () => {
    const incomplete = { ...session, status: "in_progress" as const };
    expect(buildStudentReport({ ...input, session: incomplete })).toBeNull();
  });

  it("consolida todas as seções quando a cadeia está completa", () => {
    const report = buildStudentReport(input);
    expect(report).not.toBeNull();
    expect(report!.meta.studentName).toBe("Renato Teste");
    expect(report!.meta.goalLabel).toBe("Emagrecimento");
    expect(report!.scores.length).toBeGreaterThan(0);
    expect(report!.strategy.decisions).toHaveLength(12);
    expect(report!.macros.calories).toBeGreaterThan(0);
    expect(report!.mealPlan.meals.length).toBe(report!.strategy.mealsPerDay);
    expect(report!.roadmap.phases).toHaveLength(7);
    // sem acompanhamentos ainda
    expect(report!.evolution).toBeNull();
  });

  it("inclui evolução quando há acompanhamentos", () => {
    const followUps: FollowUp[] = [
      {
        id: "fu1",
        studentId: "s1",
        date: "2026-05-29",
        weightKg: 90.5,
        scales: { adherence: 7, hunger: 6, sleep: 7, energy: 7, mood: 7 },
        measurements: null,
        whatWorked: null,
        whatFailed: null,
        why: null,
        createdAt: "2026-05-29T09:00:00.000Z",
      },
    ];
    const report = buildStudentReport({ ...input, followUps });
    expect(report!.evolution).not.toBeNull();
    expect(report!.evolution!.currentWeight).toBe(90.5);
    // roadmap avança de fase com o acompanhamento
    expect(report!.roadmap.currentPhase).not.toBe("preparation");
  });
});
