import type { Metadata } from "next";
import { FileTextIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Relatórios" };

/** Documentos premium para o aluno (Documento 02 — Documento Final). */
export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Documentos com padrão de consultoria premium para apresentação ao aluno."
      />
      <EmptyState
        icon={<FileTextIcon />}
        title="Módulo em construção"
        description="A geração de documentos premium (resumo executivo, planos e justificativas) será implementada em sprint futura."
      />
    </>
  );
}
