import type { Metadata } from "next";
import { UsersIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Dashboard — visão executiva (Documento 02): primeiro inteligência,
 * depois detalhes. Será alimentado pelos módulos de diagnóstico e
 * estratégia nas próximas sprints.
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumo estratégico dos seus alunos e das próximas decisões."
      />
      <EmptyState
        icon={<UsersIcon />}
        title="Nenhum aluno cadastrado ainda"
        description="Cadastre o primeiro aluno para iniciar o Diagnóstico Estratégico — a base de todas as decisões do sistema."
      />
    </>
  );
}
