import type { Metadata } from "next";
import { CalendarCheckIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Acompanhamentos" };

/** Acompanhamentos — monitoramento e ajustes (Documento 01). */
export default function FollowUpsPage() {
  return (
    <>
      <PageHeader
        title="Acompanhamentos"
        description="Monitoramento contínuo: adesão, fome, sono, energia e evolução."
      />
      <EmptyState
        icon={<CalendarCheckIcon />}
        title="Módulo em construção"
        description="O acompanhamento estratégico com reavaliação automática de prioridades será implementado em sprint futura."
      />
    </>
  );
}
