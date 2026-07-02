@AGENTS.md

# Montinho Nutrition Strategy — Guia do Projeto

Sistema Inteligente de Decisão Nutricional (single-user: Montinho Personal).
Toda a especificação vive em `docs/` (Documentos 00–17). **Leia antes de implementar um módulo.**

## Hierarquia em caso de conflito entre documentos (Doc 17 — MDC)

1. `docs/12-ai-engineering-constitution.md` (como a IA trabalha)
2. `docs/17-master-development-constitution.md` (como o desenvolvimento é conduzido)
3. `docs/08-master-software-architecture.md` (arquitetura técnica)
4. PRDs (inclui `docs/00-vision-product-philosophy.md`, soberano na esfera de produto)
5. Demais documentos

## Fluxo de trabalho por Sprint (Doc 17)

Analisar projeto → planejar → explicar o plano → implementar → **type check · lint · testes ·
build** → corrigir tudo. Antes de tocar em arquivos: ler o estado atual, nunca recriar/duplicar,
sempre reutilizar, sempre buscar a solução mais simples. Regra de Ouro: **sempre verificar, nunca
assumir, sempre evoluir (nunca reconstruir).**

## Regras invioláveis

- **Pensar → planejar → validar → só então codar** (AEC Regra 1). Nunca responder apenas com código.
- **Regras de negócio somente em `services/`** — nunca em componentes React (Doc 11).
- **Validação sempre com Zod**; env vars só via `src/config/env.ts`.
- **Nenhum número mágico**: parâmetros estratégicos são configuráveis (Doc 08).
- **Banco**: toda alteração via migração em `supabase/migrations/` (nunca manual). Tudo vive no
  schema **`montinho`** (nunca `public`), para coexistir com outros apps num mesmo projeto
  Supabase; app aponta via `NEXT_PUBLIC_SUPABASE_SCHEMA`. Toda tabela tem o padrão de auditoria:
  `id` UUID, `created_at/updated_at`, `created_by/updated_by`, `is_active`, `version`, `notes`
  (Doc 10). RLS sempre.
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
para produção. Autocrítica final: _"Se fosse vendido hoje, eu teria orgulho deste módulo?"_ —
se não, melhorar antes de finalizar.
