"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, StethoscopeIcon, TargetIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import { computeScoreMap, readAnthropometry, readTrainingContext, resolveAgeYears, resolveHeightCm } from "@/modules/diagnosis/services";
import { buildStrategy, evaluateStrategyAlerts, resolveMacros } from "@/modules/strategy/services";
import { useMacroControls } from "@/modules/strategy/hooks/use-macro-controls";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { StrategyResult } from "@/modules/strategy/components/strategy-result";
import { StrategyMacrosSection } from "@/modules/strategy/components/strategy-macros-section";
import type { MacroContext } from "@/modules/strategy/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

/**
 * Fluxo da Estratégia de um aluno: exige um diagnóstico concluído → mostra a
 * Estratégia Nutricional → coleta o peso → calcula e exibe os macros.
 */
export function StrategyView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const { input, saveAnthropometrics, persistGoal, applyOverride, clearOverride } =
    useMacroControls(studentId);
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

  const scores = React.useMemo(
    () => (session ? computeScoreMap(session.answers) : null),
    [session],
  );

  const strategy = React.useMemo(() => {
    if (!student?.mainGoal || !session || !scores) return null;
    return buildStrategy(student.mainGoal, scores, session.answers);
  }, [student, session, scores]);

  const macros = React.useMemo(() => {
    if (!student?.mainGoal || !strategy || !input) return null;
    const ctx: MacroContext = {
      weightKg: input.currentWeightKg,
      bodyFatPct: input.bodyFatPct,
      heightCm: resolveHeightCm(student, session?.answers),
      ageYears: resolveAgeYears(student, session?.answers),
      sex: student.sex,
      activity: (session?.answers.activity as string | undefined) ?? null,
      trains: (session?.answers.trains as string | undefined) ?? null,
      ...readTrainingContext(session?.answers),
    };
    return resolveMacros(student.mainGoal, strategy, ctx, macroParams, input);
  }, [student, strategy, input, session, macroParams]);

  const trainsRegularly = session?.answers.trains === "regular";
  const alerts = React.useMemo(() => {
    if (!macros || !input || !strategy) return [];
    return evaluateStrategyAlerts({
      calories: macros.calories,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      tdee: macros.tdee,
      weightKg: input.currentWeightKg,
      direction: strategy.direction,
      trainsRegularly,
    });
  }, [macros, input, strategy, trainsRegularly]);

  // A store é lida no cliente; antes disso, evitar flash de "não encontrado".
  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Montando a estratégia..."]} />;
  }

  if (!student) {
    return (
      <>
        <PageHeader title="Estratégia" />
        <EmptyState
          icon={<TargetIcon />}
          title="Aluno não encontrado"
          description="Esse aluno não existe neste dispositivo. Volte e selecione um aluno da lista."
          action={
            <Button asChild variant="outline">
              <Link href="/students">
                <ArrowLeftIcon className="size-4" />
                Ver alunos
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const header = (
    <PageHeader
      title="Estratégia Nutricional"
      description={student.fullName}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/students">
            <ArrowLeftIcon className="size-4" />
            Alunos
          </Link>
        </Button>
      }
    />
  );

  // Sem diagnóstico concluído não há estratégia (Documento 04 — precede tudo).
  if (!session || session.status !== "completed" || !student.mainGoal) {
    return (
      <>
        {header}
        <EmptyState
          icon={<StethoscopeIcon />}
          title="Conclua o diagnóstico primeiro"
          description={
            !student.mainGoal
              ? "Defina o objetivo principal do aluno e conclua o Diagnóstico Estratégico para gerar a estratégia."
              : "A estratégia nasce do diagnóstico. Conclua a Entrevista Estratégica deste aluno para continuar."
          }
          action={
            <Button asChild>
              <Link href={`/diagnosis/${student.id}`}>Ir para o diagnóstico</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="flex flex-col gap-8">
        {strategy ? <StrategyResult strategy={strategy} /> : null}

        {strategy && scores ? (
          <StrategyMacrosSection
            goal={student.mainGoal}
            strategy={strategy}
            scores={scores}
            input={input}
            suggestedWeightKg={session ? readAnthropometry(session.answers).weightKg : null}
            macros={macros}
            macroParams={macroParams}
            alerts={alerts}
            trainsRegularly={trainsRegularly}
            mealPlanHref={`/meal-plan/${student.id}`}
            onSaveAnthropometrics={saveAnthropometrics}
            onPersistGoal={persistGoal}
            onApplyOverride={applyOverride}
            onClearOverride={clearOverride}
          />
        ) : null}
      </div>
    </>
  );
}
