"use client";

import * as React from "react";
import { toast } from "sonner";

import { onLocalWriteError } from "@/shared/lib/local-store";
import { getSyncStatus, subscribeSyncStatus } from "@/modules/sync/services/cloudSync";

/**
 * Avisa o treinador quando uma alteração de verdade não foi salva — antes
 * disso era 100% silencioso (só um log no console). Duas fontes de risco:
 *
 *  - a gravação NESTE navegador falhou (cota de armazenamento esgotada,
 *    navegação privada em alguns navegadores) — a mudança feita na tela nunca
 *    chegou a persistir, e "some" ao recarregar;
 *  - o backup na nuvem falhou nesta rodada — o dado local está seguro, mas
 *    ficou pra trás em relação a outros dispositivos até a próxima tentativa.
 *
 * Puramente um observador (Documento 02 — nunca esconder um risco); não muda
 * nenhum dado.
 */
export function StorageAlerts() {
  React.useEffect(
    () =>
      onLocalWriteError(() => {
        toast.error("Não foi possível salvar esta alteração neste navegador.", {
          description:
            "Pode ser falta de espaço de armazenamento ou o modo de navegação privada. Libere espaço ou tente em outra aba/navegador — e confira se a alteração ficou salva.",
          duration: 10000,
        });
      }),
    [],
  );

  React.useEffect(() => {
    let previous = getSyncStatus();
    return subscribeSyncStatus(() => {
      const current = getSyncStatus();
      // Só avisa na TRANSIÇÃO para erro — evita repetir o aviso a cada nova
      // tentativa enquanto o problema persiste.
      if (current === "error" && previous !== "error") {
        toast.warning("O backup na nuvem falhou nesta sincronização.", {
          description:
            "Suas alterações continuam salvas neste navegador. Confira a conexão ou tente novamente em Configurações.",
          duration: 8000,
        });
      }
      previous = current;
    });
  }, []);

  return null;
}
