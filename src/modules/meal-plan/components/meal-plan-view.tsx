"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, UtensilsIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import { MealPlanBoard } from "@/modules/meal-plan/components/meal-plan-board";

const EMPTY_STUDENTS: Student[] = [];

/**
 * Fluxo do Plano Alimentar de um aluno: exige a cadeia Diagnóstico → Estratégia
 * → Macros e, a partir dela, monta o cardápio do dia (com troca inteligente).
 */
export function MealPlanView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const student = React.useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );

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

  return (
    <>
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
      <MealPlanBoard studentId={studentId} />
    </>
  );
}
