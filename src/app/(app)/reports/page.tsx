import type { Metadata } from "next";

import { ReportsIndex } from "@/modules/reports/components/reports-index";

export const metadata: Metadata = { title: "Relatórios" };

/** Índice dos Relatórios (Documento 02 — escolher um aluno). */
export default function ReportsPage() {
  return <ReportsIndex />;
}
