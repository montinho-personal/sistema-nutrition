"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, InfoIcon, PillIcon, StethoscopeIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { SectionHeader } from "@/shared/components/section-header";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import { computeScoreMap } from "@/modules/diagnosis/services";
import { recommendSupplements } from "@/modules/supplements/services";
import type { SupplementContext } from "@/modules/supplements/types";
import { SupplementCard } from "@/modules/supplements/components/supplement-card";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

/** Suplementação de um aluno: primeiro a dificuldade, depois o suplemento. */
export function SupplementsView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);

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

  const recommendations = React.useMemo(() => {
    if (!session || session.status !== "completed") return null;
    const answers = session.answers;
    const scores = computeScoreMap(answers);
    const ctx: SupplementContext = {
      trains: (answers.trains as string | undefined) ?? null,
      hungerControl: scores.hungerControl,
      practicality: scores.practicality,
      restrictions: Array.isArray(answers.restrictions) ? (answers.restrictions as string[]) : [],
      healthConditions: Array.isArray(answers.health_conditions)
        ? (answers.health_conditions as string[])
        : [],
      sleepHours: typeof answers.sleep_hours === "number" ? answers.sleep_hours : null,
      mealsOut: (answers.meals_out as string | undefined) ?? null,
      budgetTight: answers.budget === "apertado",
      openness: (answers.supplement_openness as string | undefined) ?? null,
    };
    return recommendSupplements(ctx);
  }, [session]);

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Avaliando a suplementação..."]} />;
  }

  if (!student) {
    return (
      <>
        <PageHeader title="Suplementação" />
        <EmptyState
          icon={<PillIcon />}
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
      title="Suplementação"
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

  if (!recommendations) {
    return (
      <>
        {header}
        <EmptyState
          icon={<StethoscopeIcon />}
          title="Conclua o diagnóstico primeiro"
          description="A suplementação parte das dificuldades reais do aluno. Conclua a Entrevista Estratégica para avaliar o que realmente faz sentido."
          action={
            <Button asChild>
              <Link href={`/diagnosis/${student.id}`}>Ir para o diagnóstico</Link>
            </Button>
          }
        />
      </>
    );
  }

  const recommended = recommendations.filter((r) => r.status === "recommended");
  const consider = recommendations.filter((r) => r.status === "consider");
  const rest = recommendations.filter(
    (r) => r.status === "not_needed" || r.status === "not_indicated",
  );

  return (
    <>
      {header}
      <div className="flex flex-col gap-6">
        <Card className="border-l-2 border-l-gold">
          <CardContent className="flex items-start gap-3 pt-6">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-gold" />
            <p className="text-sm text-muted-foreground">
              Suplemento nunca é o ponto de partida. Primeiro perguntamos{" "}
              <strong className="text-foreground">qual dificuldade resolver</strong> e se a{" "}
              <strong className="text-foreground">comida</strong> já dá conta. Só então um
              suplemento entra — quando realmente facilita a rotina.
            </p>
          </CardContent>
        </Card>

        {recommended.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Recomendados"
              description="Uma dificuldade concreta justifica cada um."
            />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {recommended.map((item) => (
                <SupplementCard key={item.supplement.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {consider.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Avaliar"
              description="Podem ajudar, mas orçamento ou preferência pedem cautela."
            />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {consider.map((item) => (
                <SupplementCard key={item.supplement.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Não necessários agora"
              description="Sem dificuldade que os justifique — resolver pela comida."
            />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {rest.map((item) => (
                <SupplementCard key={item.supplement.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
