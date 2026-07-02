import Link from "next/link";
import { CompassIcon, HomeIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

/** 404 amigável — orienta o caminho de volta em vez de um beco sem saída. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CompassIcon className="size-6" />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O endereço não existe ou foi movido. Volte ao painel para continuar de onde parou.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <HomeIcon className="size-4" />
          Ir para o painel
        </Link>
      </Button>
    </div>
  );
}
