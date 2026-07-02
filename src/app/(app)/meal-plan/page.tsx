import type { Metadata } from "next";
import { UtensilsIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Plano Alimentar" };

/** Plano Alimentar — consequência da estratégia (Documento 00). */
export default function MealPlanPage() {
  return (
    <>
      <PageHeader
        title="Plano Alimentar"
        description="A dieta é consequência das decisões estratégicas — nunca o ponto de partida."
      />
      <EmptyState
        icon={<UtensilsIcon />}
        title="Módulo em construção"
        description="A estrutura de refeições e a seleção inteligente de alimentos serão implementadas após Estratégia e Macros."
      />
    </>
  );
}
