import { redirect } from "next/navigation";

/** A raiz redireciona para a Central de Decisão. */
export default function RootPage() {
  redirect("/dashboard");
}
