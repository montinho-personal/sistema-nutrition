import type { Metadata } from "next";

import { StrategyView } from "@/modules/strategy/components/strategy-view";

export const metadata: Metadata = { title: "Estratégia" };

/** Estratégia Nutricional de um aluno (Documento 04 — SPE + Macros). */
export default async function StrategyStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StrategyView studentId={studentId} />;
}
