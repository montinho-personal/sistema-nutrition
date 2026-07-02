import type { Metadata } from "next";

import { StrategyIndex } from "@/modules/strategy/components/strategy-index";

export const metadata: Metadata = { title: "Estratégia" };

/** Índice da Estratégia (Documento 04 — SPE): escolher um aluno. */
export default function StrategyPage() {
  return <StrategyIndex />;
}
