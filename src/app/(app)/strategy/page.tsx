import type { Metadata } from "next";
import { TargetIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Estratégia" };

/** Estratégia Nutricional (Documento 04 — Strategic Prescription Engine). */
export default function StrategyPage() {
  return (
    <>
      <PageHeader
        title="Estratégia"
        description="A estratégia vem antes da matemática: decisões justificadas antes de qualquer caloria."
      />
      <EmptyState
        icon={<TargetIcon />}
        title="Módulo em construção"
        description="O Strategic Prescription Engine — as 12 etapas da prescrição estratégica — depende do Diagnóstico e será implementado em sprint futura."
      />
    </>
  );
}
