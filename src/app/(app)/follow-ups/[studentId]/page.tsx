import type { Metadata } from "next";

import { FollowUpsView } from "@/modules/follow-ups/components/follow-ups-view";

export const metadata: Metadata = { title: "Acompanhamentos" };

/** Acompanhamentos de um aluno (Documentos 05, 03F — PNI + evolução). */
export default async function FollowUpsStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <FollowUpsView studentId={studentId} />;
}
