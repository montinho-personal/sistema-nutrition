"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  StethoscopeIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";

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
import { buildStrategy, resolveMacros } from "@/modules/strategy/services";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { AnthropometricsForm } from "@/modules/strategy/components/anthropometrics-form";
import { StrategyResult } from "@/modules/strategy/components/strategy-result";
import { MacroSummary } from "@/modules/strategy/components/macro-summary";
import { MacroOverrideForm } from "@/modules/strategy/components/macro-override-form";
import { GoalDefinition } from "@/modules/strategy/components/goal-definition";
import type {
  MacroContext,
  MacroOverride,
  MacroTargets,
  StrategyInput,
} from "@/modules/strategy/types";

/** Divisão percentual dos macros a partir dos alvos atuais (soma exata = 100). */
function overrideFromMacros(macros: MacroTargets): MacroOverride {
  const total = macros.proteinKcal + macros.carbKcal + macros.fatKcal || 1;
  const proteinPct = Math.round((macros.proteinKcal / total) * 100);
  const fatPct = Math.round((macros.fatKcal / total) * 100);
  return {
    calories: macros.calories,
    proteinPct,
    fatPct,
    carbPct: Math.max(0, 100 - proteinPct - fatPct),
  };
}

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
  const macroParams = useMacroParams();
  const [editing, setEditing] = React.useState(false);
  const [editingMacros, setEditingMacros] = React.useState(false);

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
      heightCm: student.heightCm,
      ageYears: ageFromBirthDate(student.birthDate),
      sex: student.sex,
      activity: (session?.answers.activity as string | undefined) ?? null,
      trains: (session?.answers.trains as string | undefined) ?? null,
    };
    return resolveMacros(student.mainGoal, strategy, ctx, macroParams, input);
  }, [student, strategy, input, session, macroParams]);

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

  // Preserva a meta/prazo já definidos ao recalcular só o peso.
  const handleSave = (values: StrategyInput) => {
    save({ ...input, ...values });
    setEditing(false);
  };

  const persistGoal = (targetChangeKg: number | null, targetWeeks: number | null) => {
    if (!input) return;
    save({ ...input, targetChangeKg, targetWeeks });
  };

  const applyOverride = (macroOverride: MacroOverride) => {
    if (!input) return;
    save({ ...input, macroOverride });
    setEditingMacros(false);
  };

  const clearOverride = () => {
    if (!input) return;
    save({ ...input, macroOverride: null });
    setEditingMacros(false);
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {input.currentWeightKg} kg
                  {input.bodyFatPct ? ` · ${input.bodyFatPct}% gordura` : ""}
                  {` · objetivo: ${STUDENT_GOAL_LABELS[student.mainGoal]}`}
                </Badge>
                {macros.manual ? (
                  <Badge className="bg-gold text-gold-foreground hover:bg-gold">
                    <SlidersHorizontalIcon className="size-3" />
                    Ajuste manual
                  </Badge>
                ) : input.targetChangeKg &&
                  input.targetWeeks &&
                  strategy &&
                  strategy.direction !== "manutencao" ? (
                  <Badge variant="secondary">
                    <TargetIcon className="size-3" />
                    Calorias pela meta
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <PencilIcon className="size-4" />
                  Ajustar peso
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMacros((v) => !v)}
                >
                  <SlidersHorizontalIcon className="size-4" />
                  Ajustar macros
                </Button>
                {macros.manual ? (
                  <Button variant="ghost" size="sm" onClick={clearOverride}>
                    <RotateCcwIcon className="size-4" />
                    Voltar ao automático
                  </Button>
                ) : null}
                <Button asChild size="sm">
                  <Link href={`/meal-plan/${student.id}`}>
                    <UtensilsIcon className="size-4" />
                    Ver plano alimentar
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {editingMacros ? (
              <MacroOverrideForm
                initial={overrideFromMacros(macros)}
                onSubmit={applyOverride}
                onCancel={() => setEditingMacros(false)}
              />
            ) : null}

            <MacroSummary macros={macros} />

            {strategy && scores && strategy.direction !== "manutencao" ? (
              <GoalDefinition
                direction={strategy.direction}
                velocity={strategy.velocity}
                tdee={macros.tdee}
                currentWeightKg={input.currentWeightKg}
                capacity={scores.adherence + scores.consistency - scores.abandonmentRisk}
                prescribedDeltaPct={
                  strategy.direction === "deficit"
                    ? macroParams.velocityDeficitPct[strategy.velocity]
                    : macroParams.velocitySurplusPct[strategy.velocity]
                }
                trainsRegularly={session?.answers.trains === "regular"}
                proteinAdequate={macroParams.proteinGPerKg[student.mainGoal] >= 1.6}
                initialTargetKg={input.targetChangeKg ?? null}
                initialWeeks={input.targetWeeks ?? null}
                drivesPlan={!macros.manual}
                onPersist={persistGoal}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
