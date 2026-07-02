import type { Metadata } from "next";

import { SettingsView } from "@/modules/settings/components/settings-view";

export const metadata: Metadata = { title: "Configurações" };

/** Configurações — parâmetros estratégicos configuráveis (Documento 08). */
export default function SettingsPage() {
  return <SettingsView />;
}
