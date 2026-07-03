"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import { ageFromBirthDate, computeScoreMap } from "@/modules/diagnosis/services";
import { buildStrategy, evaluateStrategyAlerts, resolveMacros } from "@/modules/strategy/services";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import type { MacroContext, MacroTargets, NutritionStrategy } from "@/modules/strategy/types";
import { deriveStepState, firstActionableStep } from "@/modules/flow/services/flowProgress";
import type { FlowStepId } from "@/modules/flow/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

/** Um alerta do fluxo, exibido na Strategy Rail. */
export interface FlowAlert {
  level: "info" | "warn" | "high";
  text: string;
}

export interface FlowData {
  student: Student | null;
  session: DiagnosisSession | null;
  strategy: NutritionStrategy | null;
  macros: MacroTargets | null;
  proteinPerKg: number | null;
  /** Estado de cada etapa: alcançável (pré-requisito ok) e concluída. */
  stepState: Record<FlowStepId, { reachable: boolean; done: boolean }>;
  /** Primeira etapa alcançável ainda não concluída (para retomar). */
  firstActionable: FlowStepId;
  alerts: FlowAlert[];
  /** true enquanto lemos a store no cliente (evita flash). */
  ready: boolean;
}

/**
 * Reúne, de forma reativa, tudo o que o fluxo precisa de um aluno — reaproveita
 * os mesmos motores da Estratégia e do Diagnóstico, sem duplicar regra.
 */
export function useFlowData(studentId: string): FlowData {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const { input } = useStrategyInput(studentId);
  const macroParams = useMacroParams();

  const student = React.useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );

  const session = React.useMemo(
    () =>
      sessions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
    [sessions, studentId],
  );

  const anamneseComplete = session?.status === "completed";
  const hasGoal = Boolean(student?.mainGoal);
  const diagnosticoReady = anamneseComplete && hasGoal;

  const strategy = React.useMemo(() => {
    if (!student?.mainGoal || !session || !diagnosticoReady) return null;
    return buildStrategy(student.mainGoal, computeScoreMap(session.answers), session.answers);
  }, [student, session, diagnosticoReady]);

  const macros = React.useMemo(() => {
    if (!student?.mainGoal || !strategy || !input) return null;
    const ctx: MacroContext = {
      weightKg: input.currentWeightKg,
      bodyFatPct: input.bodyFatPct,
      heightCm: student.heightCm,
      ageYears: ageFromBirthDate(student.birthDate),
      sex: student.sex,
      activity: (session?.answers.activity as string | undefined) ?? null,
      trains: (session?.answers.trains as string | undefined) ?? null,
    };
    return resolveMacros(student.mainGoal, strategy, ctx, macroParams, input);
  }, [student, strategy, input, session, macroParams]);

  const estrategiaComplete = Boolean(macros);
  const proteinPerKg =
    macros && input && input.currentWeightKg > 0 ? macros.proteinG / input.currentWeightKg : null;

  const stepState = React.useMemo(
    () =>
      deriveStepState({
        anamneseComplete: Boolean(anamneseComplete),
        hasGoal,
        estrategiaComplete,
      }),
    [anamneseComplete, hasGoal, estrategiaComplete],
  );

  const firstActionable = React.useMemo(() => firstActionableStep(stepState), [stepState]);

  const alerts = React.useMemo<FlowAlert[]>(() => {
    const out: FlowAlert[] = [];
    if (!hasGoal) out.push({ level: "warn", text: "Defina o objetivo principal do aluno." });
    if (!anamneseComplete) out.push({ level: "warn", text: "Anamnese ainda não concluída." });
    if (diagnosticoReady && !input)
      out.push({ level: "warn", text: "Informe o peso para calcular os macros." });
    if (macros?.manual) out.push({ level: "info", text: "Macros com ajuste manual do treinador." });
    if (
      macros &&
      !macros.manual &&
      input?.targetChangeKg &&
      input?.targetWeeks &&
      strategy &&
      strategy.direction !== "manutencao"
    )
      out.push({ level: "info", text: "Calorias seguindo a meta definida." });
    // Alertas inteligentes da estratégia (mesmo motor da Etapa 3).
    if (macros && input && strategy) {
      for (const a of evaluateStrategyAlerts({
        calories: macros.calories,
        proteinG: macros.proteinG,
        fatG: macros.fatG,
        tdee: macros.tdee,
        weightKg: input.currentWeightKg,
        direction: strategy.direction,
        trainsRegularly: session?.answers.trains === "regular",
      })) {
        if (a.level === "green") continue;
        out.push({ level: a.level === "red" ? "high" : "warn", text: a.title });
      }
    }
    return out;
  }, [hasGoal, anamneseComplete, diagnosticoReady, input, macros, strategy, session]);

  const ready = typeof window !== "undefined";

  return {
    student,
    session,
    strategy,
    macros,
    proteinPerKg,
    stepState,
    firstActionable,
    alerts,
    ready,
  };
}
