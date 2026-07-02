import type { Metadata } from "next";
import { SaladIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Alimentos" };

/** Banco Inteligente de Alimentos (Documento 03G — Biblioteca 2, TBCA/TACO). */
export default function FoodsPage() {
  return (
    <>
      <PageHeader
        title="Alimentos"
        description="Banco inteligente: além dos macros — saciedade, praticidade, custo e aplicações estratégicas."
      />
      <EmptyState
        icon={<SaladIcon />}
        title="Módulo em construção"
        description="A biblioteca de alimentos com dados TBCA/TACO e atributos estratégicos será implementada em sprint futura."
      />
    </>
  );
}
