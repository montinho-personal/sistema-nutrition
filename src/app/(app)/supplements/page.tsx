import type { Metadata } from "next";
import { PillIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Suplementação" };

/** Suplementação estratégica (Documento 00 — nunca protagonista). */
export default function SupplementsPage() {
  return (
    <>
      <PageHeader
        title="Suplementação"
        description="Suplementos aparecem somente quando agregam valor — sempre depois da alimentação."
      />
      <EmptyState
        icon={<PillIcon />}
        title="Módulo em construção"
        description="O banco de suplementos com nível de evidência e alternativas alimentares será implementado em sprint futura."
      />
    </>
  );
}
