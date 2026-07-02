import type { Metadata } from "next";
import { MapIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Roadmap" };

/** Roadmap da transformação (Documento 03E — as 7 fases). */
export default function RoadmapPage() {
  return (
    <>
      <PageHeader
        title="Roadmap"
        description="A jornada completa da transformação — o sistema entrega um caminho, não uma dieta."
      />
      <EmptyState
        icon={<MapIcon />}
        title="Módulo em construção"
        description="A Transformation Roadmap Engine — 7 fases com critérios de evolução — será implementada em sprint futura."
      />
    </>
  );
}
