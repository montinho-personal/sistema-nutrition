import type { Metadata } from "next";

import { RoadmapView } from "@/modules/roadmap/components/roadmap-view";

export const metadata: Metadata = { title: "Roadmap" };

/** Roadmap da Transformação de um aluno (Documento 03E — as 7 fases). */
export default async function RoadmapStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <RoadmapView studentId={studentId} />;
}
