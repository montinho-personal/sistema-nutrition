import type { Metadata } from "next";

import { FlowPicker } from "@/modules/flow/components/flow-picker";

export const metadata: Metadata = { title: "Montar estratégia" };

/** Escolha do aluno para iniciar o fluxo (Workflow V1). */
export default function FlowPickerPage() {
  return <FlowPicker />;
}
