import type { Metadata } from "next";
import Link from "next/link";
import { UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Diagnóstico" };

/**
 * Índice do Diagnóstico: o diagnóstico é sempre de um aluno específico.
 * Aqui orientamos a escolher/cadastrar um aluno (Documento 06).
 */
export default function DiagnosisIndexPage() {
  return (
    <>
      <PageHeader
        title="Diagnóstico Estratégico"
        description="A entrevista inteligente que compreende o aluno antes de qualquer decisão."
      />
      <EmptyState
        icon={<UsersIcon />}
        title="Escolha um aluno para começar"
        description="O diagnóstico é sempre individual. Selecione um aluno na lista (ou cadastre um novo) e inicie a Entrevista Estratégica."
        action={
          <Button asChild>
            <Link href="/students">Ir para Alunos</Link>
          </Button>
        }
      />
    </>
  );
}
