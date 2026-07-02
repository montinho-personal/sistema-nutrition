import type { Metadata } from "next";

import { RoadmapIndex } from "@/modules/roadmap/components/roadmap-index";

export const metadata: Metadata = { title: "Roadmap" };

/** Índice do Roadmap (Documento 03E — escolher um aluno). */
export default function RoadmapPage() {
  return <RoadmapIndex />;
}
