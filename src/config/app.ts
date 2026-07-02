/**
 * Configuração da aplicação.
 *
 * Parâmetros estratégicos são sempre configuráveis (Documento 08):
 * nunca deixar valores fixos espalhados pelo código.
 */

export const appConfig = {
  name: "Montinho Nutrition Strategy",
  shortName: "Montinho",
  description:
    "Sistema Inteligente de Decisão Nutricional para uso profissional do Montinho Personal.",
  /** Idioma padrão. Estrutura preparada para internacionalização futura. */
  defaultLocale: "pt-BR",
} as const;
