"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, RefreshCwIcon, TargetIcon, UtensilsIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { SectionHeader } from "@/shared/components/section-header";
import { MetricCard } from "@/shared/components/metric-card";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import { ageFromBirthDate, computeScoreMap } from "@/modules/diagnosis/services";
import { buildStrategy, computeMacros } from "@/modules/strategy/services";
import { SCORE_THRESHOLDS } from "@/modules/strategy/constants/parameters";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import type { MacroContext } from "@/modules/strategy/types";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildMealPlan, type MealPlanContext } from "@/modules/meal-plan/services";
import { useMealPlanVariant } from "@/modules/meal-plan/hooks/use-meal-plan-variant";
import { MealCard } from "@/modules/meal-plan/components/meal-card";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

/**
 * Fluxo do Plano Alimentar de um aluno: exige a cadeia Diagnóstico → Estratégia
 * → Macros e, a partir dela, monta o cardápio do dia.
 */
export function MealPlanView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const { input } = useStrategyInput(studentId);
  const macroParams = useMacroParams();
  const { variant, next } = useMealPlanVariant(studentId);

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

  const plan = React.useMemo(() => {
    if (!student?.mainGoal || !session || session.status !== "completed" || !input) return null;
    const scores = computeScoreMap(session.answers);
    const strategy = buildStrategy(student.mainGoal, scores, session.answers);
    const macroCtx: MacroContext = {
      weightKg: input.currentWeightKg,
      bodyFatPct: input.bodyFatPct,
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
    const restrictions = Array.isArray(session.answers.restrictions)
      ? (session.answers.restrictions as string[])
      : [];
    const ctx: MealPlanContext = {
      goal: student.mainGoal,
      mealsPerDay: strategy.mealsPerDay,
      macros: {
        kcal: macros.calories,
        protein: macros.proteinG,
        carbs: macros.carbG,
        fat: macros.fatG,
      },
      emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low,
      emphasizePracticality: scores.practicality <= SCORE_THRESHOLDS.low,
      budgetTight: session.answers.budget === "apertado",
      restrictions,
      variant,
    };
    return buildMealPlan(curatedFoods, ctx);
  }, [student, session, input, variant, macroParams]);

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Montando o cardápio..."]} />;
  }

  if (!student) {
    return (
      <>
        <PageHeader title="Plano Alimentar" />
        <EmptyState
          icon={<UtensilsIcon />}
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
      title="Plano Alimentar"
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

  // A dieta é consequência da estratégia: sem a cadeia completa, não há cardápio.
  if (!plan) {
    const needsStrategy = !input;
    return (
      <>
        {header}
        <EmptyState
          icon={<TargetIcon />}
          title={needsStrategy ? "Defina a estratégia primeiro" : "Conclua o diagnóstico primeiro"}
          description="A dieta é consequência das decisões estratégicas. Gere a Estratégia e os Macros deste aluno para montar o cardápio."
          action={
            <Button asChild>
              <Link href={`/strategy/${student.id}`}>Ir para a estratégia</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Resumo do dia"
            description="Total do cardápio ante o alvo dos macros."
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Calorias"
              value={`${plan.totals.kcal} kcal`}
              delta={`${plan.accuracy.kcal}% do alvo (${plan.target.kcal})`}
              trend="flat"
            />
            <MetricCard
              label="Proteína"
              value={`${plan.totals.protein} g`}
              delta={`${plan.accuracy.protein}% do alvo (${plan.target.protein})`}
              trend="flat"
            />
            <MetricCard
              label="Carboidrato"
              value={`${plan.totals.carbs} g`}
              delta={`${plan.accuracy.carbs}% do alvo (${plan.target.carbs})`}
              trend="flat"
            />
            <MetricCard
              label="Gordura"
              value={`${plan.totals.fat} g`}
              delta={`${plan.accuracy.fat}% do alvo (${plan.target.fat})`}
              trend="flat"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Cardápio"
              description="Refeições montadas a partir da estratégia e do Banco de Alimentos."
            />
            <Button variant="outline" size="sm" onClick={next}>
              <RefreshCwIcon className="size-4" />
              Gerar outra opção
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {plan.meals.map((meal) => (
              <MealCard key={meal.slot} meal={meal} />
            ))}
          </div>
        </section>

        <Card>
          <CardContent className="flex flex-col gap-1.5 pt-6 text-sm text-muted-foreground">
            {plan.notes.map((note) => (
              <div key={note} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
