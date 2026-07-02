import type { Metadata } from "next";
import { StethoscopeIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Diagnóstico" };

/**
 * Diagnóstico Estratégico Nutricional (Módulo 1 — Documentos 03A, 06, 07).
 * A Entrevista Inteligente será implementada na próxima sprint.
 */
export default function DiagnosisPage() {
  return (
    <>
      <PageHeader
        title="Diagnóstico Estratégico"
        description="Entrevista inteligente que compreende profundamente o aluno antes de qualquer decisão."
      />
      <EmptyState
        icon={<StethoscopeIcon />}
        title="Módulo em construção"
        description="A Entrevista Estratégica adaptativa — com hipóteses, scores e resumo executivo — será implementada na próxima sprint."
      />
    </>
  );
}
