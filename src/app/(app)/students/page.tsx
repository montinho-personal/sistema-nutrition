import type { Metadata } from "next";
import { UsersIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Alunos" };

/** Alunos — gestão dos perfis (Domain Students, Documento 10). */
export default function StudentsPage() {
  return (
    <>
      <PageHeader title="Alunos" description="Perfis permanentes e jornada de cada aluno." />
      <EmptyState
        icon={<UsersIcon />}
        title="Nenhum aluno cadastrado"
        description="O cadastro de alunos será implementado na próxima sprint, junto com o Diagnóstico Estratégico."
      />
    </>
  );
}
