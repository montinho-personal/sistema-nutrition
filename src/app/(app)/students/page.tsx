import type { Metadata } from "next";

import { StudentsView } from "@/modules/students/components/students-view";

export const metadata: Metadata = { title: "Alunos" };

/** Gestão de alunos (Documento 10 — Domain Students). */
export default function StudentsPage() {
  return <StudentsView />;
}
