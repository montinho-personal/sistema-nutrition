import type { Metadata } from "next";

import { ReportView } from "@/modules/reports/components/report-view";

export const metadata: Metadata = { title: "Relatório" };

/** Relatório consolidado de um aluno (Documento 02 — Documento Final). */
export default async function ReportStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <ReportView studentId={studentId} />;
}
