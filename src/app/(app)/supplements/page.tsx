import type { Metadata } from "next";

import { SupplementsIndex } from "@/modules/supplements/components/supplements-index";

export const metadata: Metadata = { title: "Suplementação" };

/** Índice da Suplementação (Documento 00 — escolher um aluno). */
export default function SupplementsPage() {
  return <SupplementsIndex />;
}
