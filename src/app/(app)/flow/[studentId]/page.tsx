import type { Metadata } from "next";

import { FlowView } from "@/modules/flow/components/flow-view";

export const metadata: Metadata = { title: "Montar estratégia" };

/** Fluxo guiado de 7 etapas de um aluno (Workflow V1). */
export default async function FlowStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <FlowView studentId={studentId} />;
}
