import type { Metadata } from "next";

import { DiagnosisView } from "@/modules/diagnosis/components/diagnosis-view";

export const metadata: Metadata = { title: "Diagnóstico" };

/** Diagnóstico Estratégico de um aluno (Módulo 1 — Documentos 03A/03B/06/07). */
export default async function DiagnosisStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <DiagnosisView studentId={studentId} />;
}
