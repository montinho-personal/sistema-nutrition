"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon, StethoscopeIcon, TargetIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import { ageFromBirthDate, computeScoreMap } from "@/modules/diagnosis/services";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import { buildStrategy, computeMacros } from "@/modules/strategy/services";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { AnthropometricsForm } from "@/modules/strategy/components/anthropometrics-form";
import { StrategyResult } from "@/modules/strategy/components/strategy-result";
import { MacroSummary } from "@/modules/strategy/components/macro-summary";
import type { MacroContext, StrategyInput } from "@/modules/strategy/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

/**
 * Fluxo da Estratégia de um aluno: exige um diagnóstico concluído → mostra a
 * Estratégia Nutricional → coleta o peso → calcula e exibe os macros.
 */
export function StrategyView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const { input, save } = useStrategyInput(studentId);
  const [editing, setEditing] = React.useState(false);

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

  const strategy = React.useMemo(() => {
    if (!student?.mainGoal || !session) return null;
    const scores = computeScoreMap(session.answers);
    return buildStrategy(student.mainGoal, scores, session.answers);
  }, [student, session]);

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
    return computeMacros(student.mainGoal, strategy.direction, strategy.velocity, ctx);
  }, [student, strategy, input, session]);

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

  const handleSave = (values: StrategyInput) => {
    save(values);
    setEditing(false);
  };

  return (
    <>
      {header}
      <div className="flex flex-col gap-8">
        {strategy ? <StrategyResult strategy={strategy} /> : null}

        {!input || editing ? (
          <AnthropometricsForm
            initial={input}
            onSubmit={handleSave}
            submitLabel={input ? "Recalcular macros" : "Calcular macros"}
          />
        ) : macros ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {input.currentWeightKg} kg
                {input.bodyFatPct ? ` · ${input.bodyFatPct}% gordura` : ""}
                {` · objetivo: ${STUDENT_GOAL_LABELS[student.mainGoal]}`}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon className="size-4" />
                Ajustar peso
              </Button>
            </div>
            <MacroSummary macros={macros} />
          </div>
        ) : null}
      </div>
    </>
  );
}
