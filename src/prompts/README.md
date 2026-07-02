# Prompts

Todos os prompts internos do sistema vivem **centralizados** neste diretório
(Documento 11 — Padrão dos Prompts). Nunca escrever prompts diretamente no código.

## Formato obrigatório

Cada prompt é um arquivo TypeScript exportando um objeto com:

```ts
export const examplePrompt = {
  name: "example", // nome estável
  objective: "...", // o que o prompt resolve
  inputs: ["..."], // entradas esperadas
  outputs: ["..."], // saídas esperadas
  version: 1, // versão incremental
  history: ["v1: criação"], // histórico de mudanças
  template: `...`, // o prompt em si
};
```

## Regra da IA (Documentos 08 e 11)

Antes de criar um prompt, perguntar: **existe resposta determinística?**
Se existir → implementar como regra/código. A IA é usada apenas onde realmente
agrega interpretação (hipóteses, síntese clínica, justificativas).
