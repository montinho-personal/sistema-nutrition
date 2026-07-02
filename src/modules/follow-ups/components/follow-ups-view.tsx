"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, CalendarCheckIcon, PlusIcon, TargetIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import { ageFromBirthDate, computeScoreMap } from "@/modules/diagnosis/services";
import { buildStrategy, computeMacros } from "@/modules/strategy/services";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import type { MacroContext } from "@/modules/strategy/types";
import {
  buildEvolutionInsights,
  computeEvolution,
  computeMeasurementDeltas,
  expectedWeeklyKgFromMacros,
} from "@/modules/follow-ups/services";
import { useFollowUps } from "@/modules/follow-ups/hooks/use-follow-ups";
import { EvolutionSummary } from "@/modules/follow-ups/components/evolution-summary";
import { FollowUpHistory } from "@/modules/follow-ups/components/follow-up-history";
import { FollowUpFormDialog } from "@/modules/follow-ups/components/follow-up-form-dialog";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];
const EMPTY_RECORDS: StrategyRecord[] = [];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fluxo dos Acompanhamentos de um aluno: exige a estratégia (baseline de peso) e
 * compara a evolução real com a previsão dos macros.
 */
export function FollowUpsView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const records = useLocalCollection<StrategyRecord[]>("strategy_records", EMPTY_RECORDS);
  const { followUps, add, remove } = useFollowUps(studentId);
  const macroParams = useMacroParams();
  const [dialogOpen, setDialogOpen] = React.useState(false);

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
  const record = React.useMemo(
    () => records.find((r) => r.studentId === studentId) ?? null,
    [records, studentId],
  );

  const analysis = React.useMemo(() => {
    if (!student?.mainGoal || !session || session.status !== "completed" || !record) return null;
    const scores = computeScoreMap(session.answers);
    const strategy = buildStrategy(student.mainGoal, scores, session.answers);
    const macroCtx: MacroContext = {
      weightKg: record.input.currentWeightKg,
      bodyFatPct: record.input.bodyFatPct,
      heightCm: student.heightCm,
      ageYears: ageFromBirthDate(student.birthDate),
      sex: student.sex,
      activity: (session.answers.activity as string | undefined) ?? null,
      trains: (session.answers.trains as string | undefined) ?? null,
    };
    const macros = computeMacros(
      student.mainGoal,
      strategy.direction,
      strategy.velocity,
      macroCtx,
      macroParams,
    );
    const expectedWeeklyKg = expectedWeeklyKgFromMacros(
      strategy.direction,
      macros.tdee,
      macros.calories,
    );
    const startDate = record.createdAt.slice(0, 10);
    const evolution = computeEvolution(
      record.input.currentWeightKg,
      startDate,
      followUps,
      expectedWeeklyKg,
    );
    return {
      evolution,
      insights: buildEvolutionInsights(evolution),
      measurementDeltas: computeMeasurementDeltas(followUps),
    };
  }, [student, session, record, followUps, macroParams]);

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Carregando os acompanhamentos..."]} />;
  }

  if (!student) {
    return (
      <>
        <PageHeader title="Acompanhamentos" />
        <EmptyState
          icon={<CalendarCheckIcon />}
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
      title="Acompanhamentos"
      description={student.fullName}
      actions={
        <div className="flex items-center gap-2">
          {analysis ? (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-4" />
              Novo acompanhamento
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link href="/students">
              <ArrowLeftIcon className="size-4" />
              Alunos
            </Link>
          </Button>
        </div>
      }
    />
  );

  // O acompanhamento mede a resposta ao plano: sem estratégia, não há baseline.
  if (!analysis) {
    return (
      <>
        {header}
        <EmptyState
          icon={<TargetIcon />}
          title="Defina a estratégia primeiro"
          description="O acompanhamento compara a evolução real com o previsto. Gere a Estratégia e os Macros deste aluno (com o peso inicial) para começar."
          action={
            <Button asChild>
              <Link href={`/strategy/${student.id}`}>Ir para a estratégia</Link>
            </Button>
          }
        />
      </>
    );
  }

  const suggestedWeight = followUps.at(-1)?.weightKg ?? analysis.evolution.startWeight;

  return (
    <>
      {header}
      <div className="flex flex-col gap-8">
        <EvolutionSummary
          evolution={analysis.evolution}
          insights={analysis.insights}
          measurementDeltas={analysis.measurementDeltas}
        />

        {followUps.length === 0 ? (
          <EmptyState
            icon={<CalendarCheckIcon />}
            title="Nenhum acompanhamento ainda"
            description="Registre o primeiro acompanhamento para medir a resposta ao plano."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <PlusIcon className="size-4" />
                Registrar acompanhamento
              </Button>
            }
          />
        ) : (
          <FollowUpHistory followUps={followUps} onDelete={remove} />
        )}
      </div>

      <FollowUpFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={add}
        defaultDate={todayIso()}
        suggestedWeight={suggestedWeight}
      />
    </>
  );
}
