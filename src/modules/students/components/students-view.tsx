"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon, UserRoundIcon, UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import { useStudents } from "@/modules/students/hooks/use-students";
import { StudentFormDialog } from "@/modules/students/components/student-form-dialog";

/** Tela de gestão de alunos: lista + cadastro (persistência local). */
export function StudentsView() {
  const { students, add } = useStudents();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Cadastre e acompanhe cada aluno. O diagnóstico é a base de todas as decisões."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon className="size-4" />
            Novo aluno
          </Button>
        }
      />

      {students.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Nenhum aluno cadastrado ainda"
          description="Cadastre o primeiro aluno para iniciar o Diagnóstico Estratégico."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-4" />
              Cadastrar aluno
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {students.map((student) => (
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
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem objetivo definido</span>
                  )}
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
      )}

      <StudentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={add} />
    </>
  );
}
