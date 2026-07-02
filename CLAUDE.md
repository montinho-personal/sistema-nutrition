@AGENTS.md

# Montinho Nutrition Strategy — Guia do Projeto

Sistema Inteligente de Decisão Nutricional (single-user: Montinho Personal).
Toda a especificação vive em `docs/` (Documentos 00–13). **Leia antes de implementar um módulo.**

## Hierarquia em caso de conflito entre documentos (Doc 13)

1. `docs/12-ai-engineering-constitution.md` (como a IA trabalha)
2. `docs/08-master-software-architecture.md` (arquitetura técnica)
3. `docs/00-vision-product-philosophy.md` (filosofia do produto)
4. Demais PRDs

## Regras invioláveis

- **Pensar → planejar → validar → só então codar** (AEC Regra 1). Nunca responder apenas com código.
- **Regras de negócio somente em `services/`** — nunca em componentes React (Doc 11).
- **Validação sempre com Zod**; env vars só via `src/config/env.ts`.
- **Nenhum número mágico**: parâmetros estratégicos são configuráveis (Doc 08).
- **Banco**: toda alteração via migração em `supabase/migrations/` (nunca manual). Toda tabela
  tem o padrão de auditoria: `id` UUID, `created_at/updated_at`, `created_by/updated_by`,
  `is_active`, `notes` (Doc 10). RLS sempre.
- **Prompts** centralizados em `src/prompts/` com nome/objetivo/versão — nunca inline (Doc 11).
- **IA só onde agrega**: se existe resposta determinística, implementar como regra (Doc 08).
- **Reutilizar antes de criar**: componente/da função semelhante existe? Use-o (AEC Regra 8).
- Logs nunca contêm dados sensíveis do aluno (saúde, psicologia, finanças).

## Organização

- Por **domínio** (`src/modules/<dominio>/{components,hooks,services,types,validators,tests}`),
  nunca por tipo de arquivo. Compartilhados em `src/shared/`.
- Design System em `src/shared/components/ui/` (shadcn vendorizado — o CLI do shadcn está
  bloqueado pelo proxy de rede; adicionar componentes escrevendo-os manualmente no mesmo estilo).
- Layout: App Shell de 5 áreas (`src/shared/components/layout/`) — Doc 09.
- Next 16: usar `src/proxy.ts` (não `middleware.ts`). Docs locais em
  `node_modules/next/dist/docs/`.

## Design (Doc 02)

- Paleta: branco/preto/cinzas + **dourado discreto** (`gold`) só para destaques estratégicos.
- Nunca parecer formulário; uma tela = um objetivo; loading narrativo ("O NDE está analisando...").
- Riscos sempre acompanhados de solução. Decisões sempre com justificativa (DecisionCard).

## UI text

Interface em **pt-BR**; código e nomes em inglês, autoexplicativos
(`calculateProteinTarget`, nunca `calc`).

## Verificação

`npm run lint`, `npm run build` e `npm run test` devem passar antes de qualquer commit.
Migrações: recriar o banco do zero e rodar `supabase/tests/` num Postgres real.

## Definition of Done (Doc 16 — Master Quality Gate)

Nenhuma Sprint/módulo é "concluído" sem passar pelos 15 checkpoints do MQG. Mínimo inegociável:
testes aprovados, código documentado, banco consistente, Design System respeitado, arquitetura
limpa, UX excelente, **decisões justificadas**, desempenho adequado, docs atualizados, pronto
para produção. Autocrítica final: *"Se fosse vendido hoje, eu teria orgulho deste módulo?"* —
se não, melhorar antes de finalizar.
