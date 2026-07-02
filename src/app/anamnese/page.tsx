import type { Metadata } from "next";

import { PublicAnamnese } from "@/modules/diagnosis/components/public-anamnese";

export const metadata: Metadata = {
  title: "Anamnese",
  robots: { index: false, follow: false },
};

/**
 * Página pública da anamnese (sem login, fora do App Shell): o aluno preenche
 * pelo link que o personal enviou (?s=<studentId>&n=<nome>).
 */
export default async function AnamnesePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; n?: string }>;
}) {
  const { s, n } = await searchParams;
  return <PublicAnamnese studentId={s ?? ""} studentName={n ?? ""} />;
}
