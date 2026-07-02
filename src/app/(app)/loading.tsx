import { LoadingScreen } from "@/shared/components/loading-screen";

/**
 * Estado de carregamento das rotas do app (mostrado enquanto os Server
 * Components resolvem — ex.: leitura do Banco de Alimentos). Loading narrativo
 * (Documento 02): comunica a inteligência do sistema, nunca só "Carregando...".
 */
export default function AppLoading() {
  return <LoadingScreen />;
}
