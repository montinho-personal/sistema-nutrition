import type { Metadata } from "next";

import { PageHeader } from "@/shared/components/page-header";
import { KnowledgeBrowser } from "@/modules/knowledge/components/knowledge-browser";

export const metadata: Metadata = { title: "Fundamentos" };

/**
 * Base de Conhecimento (V2 — #3). Os princípios e fontes que embasam as decisões
 * do sistema — transparência total (Documento 00).
 */
export default function KnowledgePage() {
  return (
    <>
      <PageHeader
        title="Fundamentos"
        description="Os princípios e as fontes por trás das decisões do sistema — nada é achismo."
      />
      <KnowledgeBrowser />
    </>
  );
}
