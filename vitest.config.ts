import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Configuração do Vitest.
 * Testa a lógica pura dos serviços (regras de negócio determinísticas),
 * sem depender de banco ou navegador (Documento 11 — Padrão dos Testes).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
