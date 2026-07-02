import type { Metadata } from "next";

import { FollowUpsIndex } from "@/modules/follow-ups/components/follow-ups-index";

export const metadata: Metadata = { title: "Acompanhamentos" };

/** Índice dos Acompanhamentos (Documentos 05, 01 — escolher um aluno). */
export default function FollowUpsPage() {
  return <FollowUpsIndex />;
}
