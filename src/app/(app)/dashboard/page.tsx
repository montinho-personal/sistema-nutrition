"use client";

import Link from "next/link";
import { ArrowRightIcon, PlusIcon, UserRoundIcon, UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useStudents } from "@/modules/students/hooks/use-students";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";

/**
 * Dashboard — visão executiva (Documento 02): primeiro inteligência.
 * Mostra os alunos e o caminho para iniciar o diagnóstico.
 */
export default function DashboardPage() {
  const { students } = useStudents();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumo estratégico dos seus alunos e das próximas decisões."
        actions={
          <Button asChild>
            <Link href="/students">
              <PlusIcon className="size-4" />
              Alunos
            </Link>
          </Button>
        }
      />

      {students.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Comece cadastrando seu primeiro aluno"
          description="O Diagnóstico Estratégico — base de todas as decisões — começa a partir de um aluno."
          action={
            <Button asChild>
              <Link href="/students">Cadastrar aluno</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-sm text-muted-foreground">
            {students.length} {students.length === 1 ? "aluno" : "alunos"}
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {students.slice(0, 6).map((student) => (
              <Card key={student.id} className="gap-3 py-4">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRoundIcon className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{student.fullName}</span>
                    {student.mainGoal ? (
                      <Badge variant="secondary" className="w-fit text-[10px]">
                        {STUDENT_GOAL_LABELS[student.mainGoal]}
                      </Badge>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/diagnosis/${student.id}`}>
                      Diagnóstico
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
