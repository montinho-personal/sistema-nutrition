import type { Metadata } from "next";

import { SupplementsView } from "@/modules/supplements/components/supplements-view";

export const metadata: Metadata = { title: "Suplementação" };

/** Suplementação de um aluno (Documentos 00/04 Etapa 10; 03G). */
export default async function SupplementsStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <SupplementsView studentId={studentId} />;
}
