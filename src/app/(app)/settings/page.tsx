import type { Metadata } from "next";
import { SettingsIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export const metadata: Metadata = { title: "Configurações" };

/** Configurações — parâmetros estratégicos configuráveis (Documento 08). */
export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Parâmetros estratégicos do sistema — nenhum cálculo com valores fixos no código."
      />
      <EmptyState
        icon={<SettingsIcon />}
        title="Módulo em construção"
        description="Parâmetros de proteína, déficits, superávits e fatores de atividade serão configuráveis aqui."
      />
    </>
  );
}
